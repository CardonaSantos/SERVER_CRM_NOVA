import {
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PlataformaSesion } from '@prisma/client';
import { EventEmitter } from 'node:events';

import { PrismaService } from 'src/prisma/prisma.service';

import { JwtPayload, MetodoAutenticacion } from '../JwtGuard/jwt-payload';
import {
  AuditoriaAuthService,
  ContextoCliente,
} from './auditoria-auth.service';
import {
  ACCESS_TOKEN_TTL_SEGUNDOS,
  GRACIA_REUTILIZACION_MS,
  MOTIVO_REVOCACION,
  MotivoRevocacion,
  POLITICA_SESION,
} from './sesion.constants';
import { generarTokenOpaco, hashSha256 } from './token-opaco';

/** Datos del usuario que viajan en el access token. */
export interface UsuarioToken {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  empresaId: number;
}

export interface ParTokens {
  access_token: string;
  refresh_token: string;
  token_type: 'Bearer';
  /** Segundos de vida del access_token. */
  expires_in: number;
}

export interface OpcionesSesion extends ContextoCliente {
  plataforma: PlataformaSesion;
  instalacionId?: string | null;
}

/** Datos de la sesión que el guard necesita en cada petición. */
export interface SesionActiva {
  sesionId: string;
  usuario: { id: number; rol: string; activo: boolean; empresaId: number };
}

/** Evento emitido al revocar sesiones (lo escucha el gateway WS). */
export const EVENTO_SESIONES_REVOCADAS = 'sesiones-revocadas';

const SELECT_USUARIO_TOKEN = {
  id: true,
  nombre: true,
  correo: true,
  rol: true,
  activo: true,
  empresaId: true,
} as const;

/*
 * Instantes técnicos (UTC) de expiración: no son fechas de negocio, por
 * eso se usa el reloj del sistema y no la zona America/Guatemala.
 */
const ahora = () => new Date();
const mas = (base: Date, ms: number) => new Date(base.getTime() + ms);
const minimo = (a: Date, b: Date) => (a.getTime() <= b.getTime() ? a : b);

/**
 * TokenService (D2): emite, refresca, rota y revoca sesiones.
 *
 * - Access token: JWT de 20 min con `sid`, `amr` y `auth_time`.
 * - Refresh token: opaco, solo su hash en BD, rotación en cada uso.
 * - La sesión es la familia: reutilizar un refresh ya canjeado (fuera del
 *   margen de gracia) revoca la sesión completa (D5).
 */
@Injectable()
export class SesionesService {
  private readonly logger = new Logger(SesionesService.name);

  /** Notifica revocaciones (p. ej. al gateway WS) sin acoplar módulos. */
  readonly eventos = new EventEmitter();

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly auditoria: AuditoriaAuthService,
  ) {}

  // ---------------------------------------------------------------------
  // Emisión
  // ---------------------------------------------------------------------

  async crearSesion(
    usuario: UsuarioToken,
    opciones: OpcionesSesion,
  ): Promise<ParTokens & { sesionId: string }> {
    const politica = POLITICA_SESION[opciones.plataforma];
    const t = ahora();
    const expiraAbsolutaEn = mas(t, politica.absolutaMs);
    const refreshPlano = generarTokenOpaco();

    const sesion = await this.prisma.sesionUsuario.create({
      data: {
        usuarioId: usuario.id,
        plataforma: opciones.plataforma,
        instalacionId: opciones.instalacionId ?? null,
        ip: opciones.ip ?? null,
        userAgent: opciones.userAgent ?? null,
        creadaEn: t,
        ultimaActividadEn: t,
        expiraInactividadEn: minimo(
          mas(t, politica.inactividadMs),
          expiraAbsolutaEn,
        ),
        expiraAbsolutaEn,
        refreshTokens: {
          create: {
            tokenHash: hashSha256(refreshPlano),
            expiraEn: minimo(mas(t, politica.refreshMs), expiraAbsolutaEn),
          },
        },
      },
      select: { id: true },
    });

    return {
      sesionId: sesion.id,
      ...this.firmarAccess(usuario, sesion.id, ['pwd'], t),
      refresh_token: refreshPlano,
    };
  }

  /**
   * Access token para una sesión existente. Usado por refresh (amr 'pwd')
   * y por el step-up (amr 'pwd' + 'reauth', auth_time = ahora).
   */
  firmarAccess(
    usuario: UsuarioToken,
    sesionId: string,
    amr: MetodoAutenticacion[],
    authTime: Date,
  ): Pick<ParTokens, 'access_token' | 'token_type' | 'expires_in'> {
    const payload: JwtPayload = {
      sub: usuario.id,
      id: usuario.id,
      nombre: usuario.nombre,
      correo: usuario.correo,
      rol: usuario.rol,
      activo: usuario.activo,
      empresaId: usuario.empresaId,
      sid: sesionId,
      amr,
      auth_time: Math.floor(authTime.getTime() / 1000),
    };

    return {
      access_token: this.jwtService.sign(payload, {
        expiresIn: ACCESS_TOKEN_TTL_SEGUNDOS,
      }),
      token_type: 'Bearer',
      expires_in: ACCESS_TOKEN_TTL_SEGUNDOS,
    };
  }

  // ---------------------------------------------------------------------
  // Refresh con rotación y detección de reutilización
  // ---------------------------------------------------------------------

  async refrescar(
    refreshPlano: unknown,
    contexto: ContextoCliente,
  ): Promise<ParTokens> {
    const rechazar = (motivo: string, usuarioId?: number) => {
      this.auditoria.registrar({
        tipo: 'REFRESH',
        exitoso: false,
        motivo,
        usuarioId,
        ...contexto,
      });
      return new UnauthorizedException('Refresh token inválido o expirado.');
    };

    if (
      typeof refreshPlano !== 'string' ||
      refreshPlano.length === 0 ||
      refreshPlano.length > 256
    ) {
      throw rechazar('REFRESH_AUSENTE');
    }

    const token = await this.prisma.refreshToken.findUnique({
      where: { tokenHash: hashSha256(refreshPlano) },
      include: {
        sesion: { include: { usuario: { select: SELECT_USUARIO_TOKEN } } },
      },
    });

    if (!token) {
      throw rechazar('REFRESH_DESCONOCIDO');
    }

    const { sesion } = token;
    const usuarioId = sesion.usuarioId;
    const t = ahora();

    // --- Reutilización de un refresh ya canjeado o revocado ---------------
    if (token.usadoEn || token.revocadoEn) {
      const carreraBenigna =
        !token.revocadoEn &&
        token.usadoEn &&
        t.getTime() - token.usadoEn.getTime() < GRACIA_REUTILIZACION_MS;

      if (carreraBenigna) {
        throw rechazar('REFRESH_CARRERA', usuarioId);
      }

      if (!sesion.revocadaEn) {
        await this.revocarSesion(
          sesion.id,
          MOTIVO_REVOCACION.REUTILIZACION_REFRESH,
        );
        this.logger.warn(
          `Reutilización de refresh token: sesión ${sesion.id} del usuario ${usuarioId} revocada.`,
        );
      }

      throw rechazar('REFRESH_REUTILIZADO', usuarioId);
    }

    // --- Estado de la sesión y del usuario --------------------------------
    if (sesion.revocadaEn) throw rechazar('SESION_REVOCADA', usuarioId);
    if (sesion.expiraAbsolutaEn <= t)
      throw rechazar('SESION_EXPIRADA_ABSOLUTA', usuarioId);
    if (sesion.expiraInactividadEn <= t)
      throw rechazar('SESION_EXPIRADA_INACTIVIDAD', usuarioId);
    if (token.expiraEn <= t) throw rechazar('REFRESH_EXPIRADO', usuarioId);

    if (!sesion.usuario.activo) {
      await this.revocarSesion(sesion.id, MOTIVO_REVOCACION.USUARIO_INACTIVO);
      throw rechazar('USUARIO_INACTIVO', usuarioId);
    }

    // --- Rotación atómica --------------------------------------------------
    const politica = POLITICA_SESION[sesion.plataforma];
    const nuevoPlano = generarTokenOpaco();

    const rotado = await this.prisma.$transaction(async (tx) => {
      // Solo una petición gana el canje aunque lleguen dos a la vez.
      const marcado = await tx.refreshToken.updateMany({
        where: { id: token.id, usadoEn: null, revocadoEn: null },
        data: { usadoEn: t },
      });

      if (marcado.count !== 1) return false;

      const nuevo = await tx.refreshToken.create({
        data: {
          sesionId: sesion.id,
          tokenHash: hashSha256(nuevoPlano),
          expiraEn: minimo(mas(t, politica.refreshMs), sesion.expiraAbsolutaEn),
        },
        select: { id: true },
      });

      await tx.refreshToken.update({
        where: { id: token.id },
        data: { reemplazadoPorId: nuevo.id },
      });

      await tx.sesionUsuario.update({
        where: { id: sesion.id },
        data: {
          ultimaActividadEn: t,
          expiraInactividadEn: minimo(
            mas(t, politica.inactividadMs),
            sesion.expiraAbsolutaEn,
          ),
          ip: contexto.ip ?? sesion.ip,
          userAgent: contexto.userAgent ?? sesion.userAgent,
        },
      });

      return true;
    });

    if (!rotado) {
      throw rechazar('REFRESH_CARRERA', usuarioId);
    }

    this.auditoria.registrar({
      tipo: 'REFRESH',
      exitoso: true,
      usuarioId,
      ...contexto,
    });

    // Rol/activo actuales de la BD. El step-up no se hereda: amr = ['pwd'].
    return {
      ...this.firmarAccess(sesion.usuario, sesion.id, ['pwd'], sesion.creadaEn),
      refresh_token: nuevoPlano,
    };
  }

  // ---------------------------------------------------------------------
  // Validación (guard HTTP y gateway WS)
  // ---------------------------------------------------------------------

  /** null si la sesión no existe, está revocada, expiró o el usuario está inactivo. */
  async validarSesionActiva(
    sesionId: string,
    usuarioId: number,
  ): Promise<SesionActiva | null> {
    const sesion = await this.prisma.sesionUsuario.findUnique({
      where: { id: sesionId },
      select: {
        id: true,
        usuarioId: true,
        revocadaEn: true,
        expiraInactividadEn: true,
        expiraAbsolutaEn: true,
        usuario: {
          select: { id: true, rol: true, activo: true, empresaId: true },
        },
      },
    });

    const t = ahora();

    if (
      !sesion ||
      sesion.usuarioId !== usuarioId ||
      sesion.revocadaEn ||
      sesion.expiraAbsolutaEn <= t ||
      sesion.expiraInactividadEn <= t ||
      !sesion.usuario.activo
    ) {
      return null;
    }

    return { sesionId: sesion.id, usuario: sesion.usuario };
  }

  // ---------------------------------------------------------------------
  // Revocación y consulta
  // ---------------------------------------------------------------------

  async revocarSesion(
    sesionId: string,
    motivo: MotivoRevocacion,
  ): Promise<boolean> {
    const t = ahora();

    const [sesiones] = await this.prisma.$transaction([
      this.prisma.sesionUsuario.updateMany({
        where: { id: sesionId, revocadaEn: null },
        data: { revocadaEn: t, motivoRevocacion: motivo },
      }),
      this.prisma.refreshToken.updateMany({
        where: { sesionId, revocadoEn: null },
        data: { revocadoEn: t },
      }),
    ]);

    if (sesiones.count > 0) {
      this.eventos.emit(EVENTO_SESIONES_REVOCADAS, [sesionId]);
    }

    return sesiones.count > 0;
  }

  /** Revoca todas las sesiones activas del usuario salvo `exceptoSesionId`. */
  async revocarOtras(
    usuarioId: number,
    exceptoSesionId: string | null,
    motivo: MotivoRevocacion,
  ): Promise<number> {
    const activas = await this.prisma.sesionUsuario.findMany({
      where: {
        usuarioId,
        revocadaEn: null,
        ...(exceptoSesionId ? { id: { not: exceptoSesionId } } : {}),
      },
      select: { id: true },
    });

    let revocadas = 0;
    for (const s of activas) {
      if (await this.revocarSesion(s.id, motivo)) revocadas++;
    }
    return revocadas;
  }

  /**
   * Si el usuario quedó inactivo en la BD, revoca todas sus sesiones (y,
   * vía evento, desconecta sus sockets). Se mira el estado final y no el
   * dato de entrada: hay varios caminos para desactivar (perfil multipart,
   * edición, deactivate). Nunca lanza: la revocación no debe tumbar la
   * operación que la disparó (el guard ya rechaza a inactivos igual).
   */
  async revocarSiUsuarioInactivo(usuarioId: number): Promise<number> {
    try {
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: usuarioId },
        select: { activo: true },
      });

      if (!usuario || usuario.activo) return 0;

      const revocadas = await this.revocarOtras(
        usuarioId,
        null,
        MOTIVO_REVOCACION.USUARIO_INACTIVO,
      );

      if (revocadas > 0) {
        this.logger.log(
          `Usuario ${usuarioId} desactivado: ${revocadas} sesión(es) revocada(s).`,
        );
      }

      return revocadas;
    } catch (error) {
      this.logger.warn(
        `No se pudieron revocar las sesiones del usuario ${usuarioId}: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
      return 0;
    }
  }

  /** El usuario solo puede revocar sus propias sesiones. */
  async revocarPropia(usuarioId: number, sesionId: string): Promise<void> {
    const sesion = await this.prisma.sesionUsuario.findFirst({
      where: { id: sesionId, usuarioId },
      select: { id: true },
    });

    if (!sesion) {
      throw new NotFoundException('Sesión no encontrada.');
    }

    await this.revocarSesion(sesion.id, MOTIVO_REVOCACION.REVOCADA_POR_USUARIO);
  }

  /** Sesiones vigentes del usuario (sin datos de tokens). */
  async listarActivas(usuarioId: number, sesionActualId: string) {
    const t = ahora();

    const sesiones = await this.prisma.sesionUsuario.findMany({
      where: {
        usuarioId,
        revocadaEn: null,
        expiraAbsolutaEn: { gt: t },
        expiraInactividadEn: { gt: t },
      },
      orderBy: { ultimaActividadEn: 'desc' },
      select: {
        id: true,
        plataforma: true,
        instalacionId: true,
        ip: true,
        userAgent: true,
        creadaEn: true,
        ultimaActividadEn: true,
        expiraInactividadEn: true,
        expiraAbsolutaEn: true,
      },
    });

    return sesiones.map((s) => ({ ...s, actual: s.id === sesionActualId }));
  }

  /** Datos de token del usuario dueño de la sesión (para step-up). */
  async usuarioDeSesion(sesionId: string): Promise<UsuarioToken | null> {
    const sesion = await this.prisma.sesionUsuario.findUnique({
      where: { id: sesionId },
      select: { usuario: { select: SELECT_USUARIO_TOKEN } },
    });
    return sesion?.usuario ?? null;
  }
}
