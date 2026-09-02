import { ForbiddenException, Injectable, Logger } from '@nestjs/common';

import { PrismaService } from 'src/prisma/prisma.service';

import {
  RegisterPushDispositivoDto,
  RevokePushDispositivoDto,
} from '../dto/push-dispositivo.dto';

/*
 * =========================================================
 * TYPES
 * =========================================================
 */

export interface PushDispositivoRegistrado {
  id: number;

  instalacionId: string;

  proveedor: string;

  plataforma: string;

  activo: boolean;

  nombreDispositivo: string | null;

  modeloDispositivo: string | null;

  versionApp: string | null;

  ultimoRegistroEn: Date;
}

/*
 * =========================================================
 * SERVICE
 * =========================================================
 */

@Injectable()
export class PushDispositivosService {
  private readonly logger = new Logger(PushDispositivosService.name);

  constructor(private readonly prisma: PrismaService) {}

  /*
   * =======================================================
   * REGISTER / REFRESH
   * =======================================================
   *
   * Esta operación cubre simultáneamente:
   *
   * 1. primera instalación;
   * 2. login posterior;
   * 3. cambio de usuario en el mismo teléfono;
   * 4. rotación del token FCM;
   * 5. reactivación después de logout.
   *
   * Es deliberadamente idempotente respecto a
   * instalacionId.
   * =======================================================
   */

  async registrar(
    usuarioId: number,
    dto: RegisterPushDispositivoDto,
  ): Promise<PushDispositivoRegistrado> {
    const token = dto.token.trim();

    const instalacionId = dto.instalacionId.trim();

    /*
     * Aunque el usuario proviene del JWT, comprobamos que
     * todavía exista y continúe activo.
     *
     * Un JWT válido pero perteneciente a un usuario que fue
     * desactivado administrativamente no debe registrar
     * dispositivos nuevos.
     */
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },

      select: {
        id: true,
        activo: true,
      },
    });

    if (!usuario || !usuario.activo) {
      throw new ForbiddenException(
        'El usuario autenticado no puede registrar dispositivos push.',
      );
    }

    const ahora = new Date();

    /*
     * =====================================================
     * TRANSACTION
     * =====================================================
     *
     * El FCM token tiene UNIQUE.
     *
     * Normalmente:
     *
     * instalación A -> token A
     *
     * Pero Firebase puede renovar identidades y una
     * reinstalación puede hacer que nuestra identidad local
     * y la identidad FCM necesiten reconciliarse.
     *
     * La regla es:
     *
     * "la última instalación autenticada que presenta
     * válidamente ese token pasa a ser su propietaria".
     * =====================================================
     */

    const dispositivo = await this.prisma.$transaction(async (tx) => {
      /*
       * Si el mismo token ya se encontraba asociado a
       * otra instalación obsoleta, eliminamos aquella
       * asociación antes del upsert.
       *
       * No guardamos historial FCM en esta tabla.
       * Es estado operacional actual.
       */
      await tx.usuarioPushDispositivo.deleteMany({
        where: {
          token,

          instalacionId: {
            not: instalacionId,
          },
        },
      });

      /*
       * instalacionId es nuestra identidad estable.
       *
       * Si existe:
       *   refrescamos token + usuario + metadata.
       *
       * Si no:
       *   creamos la instalación.
       *
       * Esto también resuelve:
       *
       * logout usuario A
       * login usuario B
       *
       * en el mismo teléfono.
       */
      return tx.usuarioPushDispositivo.upsert({
        where: {
          instalacionId,
        },

        create: {
          usuarioId,

          instalacionId,

          token,

          proveedor: 'FCM',

          plataforma: 'ANDROID',

          nombreDispositivo: dto.nombreDispositivo?.trim() || null,

          modeloDispositivo: dto.modeloDispositivo?.trim() || null,

          versionApp: dto.versionApp?.trim() || null,

          activo: true,

          ultimoRegistroEn: ahora,

          revocadoEn: null,
        },

        update: {
          /*
           * Importante:
           *
           * una instalación puede cambiar de usuario
           * después de logout/login.
           */
          usuarioId,

          token,

          proveedor: 'FCM',

          plataforma: 'ANDROID',

          nombreDispositivo: dto.nombreDispositivo?.trim() || null,

          modeloDispositivo: dto.modeloDispositivo?.trim() || null,

          versionApp: dto.versionApp?.trim() || null,

          activo: true,

          ultimoRegistroEn: ahora,

          revocadoEn: null,
        },

        select: {
          id: true,

          instalacionId: true,

          proveedor: true,

          plataforma: true,

          activo: true,

          nombreDispositivo: true,

          modeloDispositivo: true,

          versionApp: true,

          ultimoRegistroEn: true,
        },
      });
    });

    /*
     * Nunca imprimimos:
     *
     * token,
     * fragmento del token,
     * credenciales Firebase.
     */
    this.logger.log(
      [
        'Dispositivo push registrado',
        `usuarioId=${usuarioId}`,
        `dispositivoId=${dispositivo.id}`,
        `plataforma=${dispositivo.plataforma}`,
      ].join(' | '),
    );

    return dispositivo;
  }

  /*
   * =======================================================
   * REVOKE
   * =======================================================
   *
   * Principalmente utilizado durante logout.
   *
   * Importante:
   *
   * incluimos usuarioId en el WHERE para impedir que un
   * usuario revoque una instalación perteneciente
   * actualmente a otro usuario.
   * =======================================================
   */

  async revocar(
    usuarioId: number,
    dto: RevokePushDispositivoDto,
  ): Promise<{
    revoked: boolean;
  }> {
    const ahora = new Date();

    const result = await this.prisma.usuarioPushDispositivo.updateMany({
      where: {
        usuarioId,

        instalacionId: dto.instalacionId.trim(),

        activo: true,
      },

      data: {
        activo: false,

        revocadoEn: ahora,
      },
    });

    if (result.count > 0) {
      this.logger.log(
        ['Dispositivo push revocado', `usuarioId=${usuarioId}`].join(' | '),
      );
    }

    /*
     * Operación idempotente.
     *
     * Revocar dos veces no debe devolver error.
     */
    return {
      revoked: result.count > 0,
    };
  }

  /*
   * =======================================================
   * TOKENS ACTIVOS POR USUARIO
   * =======================================================
   *
   * Método interno.
   *
   * Será utilizado por FirebasePushService en la próxima
   * etapa.
   *
   * NO debe exponerse directamente mediante un endpoint.
   * =======================================================
   */

  async obtenerTokensActivosPorUsuario(usuarioId: number): Promise<string[]> {
    const dispositivos = await this.prisma.usuarioPushDispositivo.findMany({
      where: {
        usuarioId,

        activo: true,

        proveedor: 'FCM',

        plataforma: 'ANDROID',
      },

      select: {
        token: true,
      },
    });

    return [
      ...new Set(
        dispositivos
          .map((dispositivo) => dispositivo.token.trim())
          .filter(Boolean),
      ),
    ];
  }

  /*
   * =======================================================
   * INVALID TOKENS
   * =======================================================
   *
   * Firebase puede responder que uno o varios registration
   * tokens dejaron de existir.
   *
   * El futuro FirebasePushService llamará aquí para impedir
   * que continuemos enviando a tokens muertos.
   * =======================================================
   */

  async desactivarTokensInvalidos(tokens: readonly string[]): Promise<number> {
    const tokensLimpios = [
      ...new Set(tokens.map((token) => token.trim()).filter(Boolean)),
    ];

    if (tokensLimpios.length === 0) {
      return 0;
    }

    const result = await this.prisma.usuarioPushDispositivo.updateMany({
      where: {
        token: {
          in: tokensLimpios,
        },

        activo: true,
      },

      data: {
        activo: false,

        revocadoEn: new Date(),
      },
    });

    if (result.count > 0) {
      this.logger.warn(
        `Firebase invalidó ${result.count} dispositivo(s) push.`,
      );
    }

    return result.count;
  }

  /*
   * =======================================================
   * PREFERENCIAS
   * =======================================================
   *
   * PerfilUsuario ya contiene:
   *
   * notificarPush
   * notificarSonido
   *
   * No necesitamos otra tabla.
   *
   * El FirebasePushService utilizará esta consulta antes de
   * decidir cómo construir el mensaje.
   * =======================================================
   */

  async obtenerPreferenciasUsuario(usuarioId: number): Promise<{
    notificarPush: boolean;
    notificarSonido: boolean;
  }> {
    const usuario = await this.prisma.usuario.findUnique({
      where: {
        id: usuarioId,
      },

      select: {
        perfil: {
          select: {
            notificarPush: true,

            notificarSonido: true,
          },
        },
      },
    });

    /*
     * Los defaults de PerfilUsuario son true.
     *
     * Usuarios históricos podrían no tener perfil creado,
     * así que conservamos el comportamiento opt-in actual.
     */
    return {
      notificarPush: usuario?.perfil?.notificarPush ?? true,

      notificarSonido: usuario?.perfil?.notificarSonido ?? true,
    };
  }
}
