import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PlataformaSesion } from '@prisma/client';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from 'src/user/app/user.service';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from './password/password.service';
import { SesionesService } from './sesiones/sesiones.service';
import {
  AuditoriaAuthService,
  ContextoCliente,
} from './sesiones/auditoria-auth.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
    private readonly sesionesService: SesionesService,
    private readonly auditoria: AuditoriaAuthService,
  ) {}

  /**
   * Migración por needsRehash (D9): tras un login correcto, si el hash es
   * bcrypt o scrypt con parámetros viejos, se reemplaza por uno vigente.
   * Un fallo aquí no bloquea el login: se reintenta en el próximo.
   */
  private async rehashSiHaceFalta(
    usuarioId: number,
    contrasena: string,
    hashActual: string,
  ): Promise<void> {
    if (!this.passwordService.needsRehash(hashActual)) return;

    try {
      await this.prisma.usuario.update({
        where: { id: usuarioId },
        data: { contrasena: await this.passwordService.hash(contrasena) },
      });
      this.logger.log(
        `Hash de contraseña migrado a scrypt: usuario ${usuarioId}`,
      );
    } catch (error) {
      this.logger.warn(
        `No se pudo migrar el hash del usuario ${usuarioId}: ${
          error instanceof Error ? error.message : 'error desconocido'
        }`,
      );
    }
  }

  // Helper para limpiar entradas (CRÍTICO PARA PRODUCCIÓN)
  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  /** Hash scrypt de relleno para igualar tiempos cuando el correo no existe. */
  private hashRelleno: Promise<string> | null = null;

  /**
   * Verifica correo y contraseña. Orden deliberado:
   * 1. Si el correo no existe se verifica igual contra un hash de relleno:
   *    el tiempo de respuesta no revela qué correos existen.
   * 2. La contraseña se verifica ANTES de mirar `activo`: sin la contraseña
   *    correcta nadie distingue "desactivado" de "credenciales inválidas".
   */
  private async verificarCredenciales(
    correo: unknown,
    contrasena: unknown,
  ): Promise<
    | { resultado: 'OK'; usuarioId: number }
    | { resultado: 'CREDENCIALES_INVALIDAS'; usuarioId: number | null }
    | { resultado: 'USUARIO_INACTIVO'; usuarioId: number }
  > {
    if (typeof correo !== 'string' || typeof contrasena !== 'string') {
      return { resultado: 'CREDENCIALES_INVALIDAS', usuarioId: null };
    }

    // Nunca registrar el correo: es dato personal y ayuda a enumerar cuentas.
    const usuario = await this.userService.findByGmail(
      this.sanitizeEmail(correo),
    );

    if (!usuario) {
      this.hashRelleno ??= this.passwordService.hash('relleno-sin-usuario');
      await this.passwordService.verify(contrasena, await this.hashRelleno);
      this.logger.warn('Intento de login fallido: usuario no encontrado');
      return { resultado: 'CREDENCIALES_INVALIDAS', usuarioId: null };
    }

    // scrypt o bcrypt heredado
    const isMatch = await this.passwordService.verify(
      contrasena,
      usuario.contrasena,
    );

    if (!isMatch) {
      this.logger.warn(
        `Intento de login fallido: contraseña incorrecta para usuario ${usuario.id}`,
      );
      return { resultado: 'CREDENCIALES_INVALIDAS', usuarioId: usuario.id };
    }

    if (!usuario.activo) {
      this.logger.warn(
        `Intento de login de usuario desactivado: ${usuario.id}`,
      );
      return { resultado: 'USUARIO_INACTIVO', usuarioId: usuario.id };
    }

    this.logger.log(`Usuario validado correctamente: ${usuario.id}`);

    await this.rehashSiHaceFalta(usuario.id, contrasena, usuario.contrasena);

    return { resultado: 'OK', usuarioId: usuario.id };
  }

  async reautenticarUsuarioPorId(
    usuarioId: number,
    contrasenaActual: string,
  ): Promise<void> {
    if (
      !Number.isInteger(usuarioId) ||
      usuarioId <= 0 ||
      typeof contrasenaActual !== 'string' ||
      contrasenaActual.trim().length === 0
    ) {
      throw new UnauthorizedException(
        'No se pudo confirmar la identidad del usuario.',
      );
    }

    const contrasenaValida = await this.userService.validarContrasenaActual(
      usuarioId,
      contrasenaActual,
    );

    if (!contrasenaValida) {
      this.logger.warn(`Reautenticación fallida para el usuario ${usuarioId}.`);

      throw new UnauthorizedException(
        'No se pudo confirmar la identidad del usuario.',
      );
    }

    this.logger.log(`Usuario ${usuarioId} reautenticado correctamente.`);
  }

  /**
   * Login: verifica credenciales, abre una SesionUsuario y devuelve
   * access_token (20 min) + refresh_token (opaco). Contrato: se conservan
   * `access_token` y `user`; se agregan refresh_token, token_type y
   * expires_in.
   */
  async login(
    correo: unknown,
    contrasena: unknown,
    opciones: {
      plataforma?: unknown;
      instalacionId?: unknown;
    } & ContextoCliente,
  ) {
    const contexto: ContextoCliente = {
      ip: opciones.ip,
      userAgent: opciones.userAgent,
    };
    const correoTexto = typeof correo === 'string' ? correo : null;

    try {
      const { plataforma, instalacionId } = this.validarPlataforma(opciones);

      const verificacion = await this.verificarCredenciales(correo, contrasena);

      if (verificacion.resultado !== 'OK') {
        this.auditoria.registrar({
          tipo: 'LOGIN',
          exitoso: false,
          motivo: verificacion.resultado,
          usuarioId: verificacion.usuarioId,
          correo: correoTexto,
          ...contexto,
        });

        throw new UnauthorizedException(
          verificacion.resultado === 'USUARIO_INACTIVO'
            ? 'Este usuario está desactivado'
            : 'Credenciales inválidas',
        );
      }

      /*
       * El login y GET /auth/profile deben
       * compartir el mismo contrato público.
       */
      const publicUser = await this.getAuthenticatedProfile(
        verificacion.usuarioId,
      );

      const { access_token, refresh_token, token_type, expires_in } =
        await this.sesionesService.crearSesion(publicUser, {
          plataforma,
          instalacionId,
          ...contexto,
        });

      this.auditoria.registrar({
        tipo: 'LOGIN',
        exitoso: true,
        usuarioId: publicUser.id,
        correo: correoTexto,
        ...contexto,
      });

      return {
        access_token,

        refresh_token,

        token_type,

        expires_in,

        user: publicUser,
      };
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throwFatalError(error, this.logger, 'auth-login');
    }
  }

  /**
   * `plataforma` es opcional (WEB por omisión: el front actual no la
   * envía). ANDROID exige `instalacionId` (UsuarioPushDispositivo).
   */
  private validarPlataforma(opciones: {
    plataforma?: unknown;
    instalacionId?: unknown;
  }): { plataforma: PlataformaSesion; instalacionId: string | null } {
    const { plataforma, instalacionId } = opciones;

    if (
      plataforma === undefined ||
      plataforma === null ||
      plataforma === 'WEB'
    ) {
      return { plataforma: PlataformaSesion.WEB, instalacionId: null };
    }

    if (plataforma !== 'ANDROID') {
      throw new BadRequestException("plataforma debe ser 'WEB' o 'ANDROID'.");
    }

    if (
      typeof instalacionId !== 'string' ||
      instalacionId.trim().length < 8 ||
      instalacionId.length > 200
    ) {
      throw new BadRequestException(
        'instalacionId es obligatorio para la plataforma ANDROID.',
      );
    }

    return {
      plataforma: PlataformaSesion.ANDROID,
      instalacionId: instalacionId.trim(),
    };
  }

  async getAuthenticatedProfile(usuarioId: number) {
    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      throw new UnauthorizedException(
        'No fue posible identificar al usuario autenticado.',
      );
    }

    const usuario = await this.userService.findUserInfo(usuarioId);

    if (!usuario) {
      throw new UnauthorizedException('El usuario autenticado ya no existe.');
    }

    if (!usuario.activo) {
      throw new UnauthorizedException('El usuario se encuentra inactivo.');
    }

    /*
     * Exponer únicamente el contrato
     * público requerido por los clientes.
     *
     * No devolver contraseña, perfil
     * completo ni otras propiedades
     * internas de Usuario.
     */
    return {
      id: usuario.id,

      nombre: usuario.nombre,

      correo: usuario.correo,

      rol: usuario.rol,

      activo: usuario.activo,

      empresaId: usuario.empresaId,

      avatarUrl: usuario.perfil?.avatar?.url ?? null,

      portadaUrl: usuario.perfil?.portada?.url ?? null,
    };
  }

  async register(createAuthDto: CreateAuthDto) {
    try {
      const { nombre, rol, correo, empresaId, contrasena } = createAuthDto;
      const cleanEmail = this.sanitizeEmail(correo);

      // 1. Verificar si ya existe antes de intentar crear (Mejor UX)
      const existe = await this.userService.findByGmail(cleanEmail);
      if (existe) {
        throw new ConflictException('El correo ya está registrado');
      }

      // 2. Hashear contraseña (scrypt)
      const hashedPassword = await this.passwordService.hash(contrasena);

      // 3. Crear usuario
      const obj = {
        nombre,
        contrasena: hashedPassword,
        rol,
        correo: cleanEmail, // Guardamos el correo limpio
        activo: true,
        empresaId,
      };

      const nuevoUsuario = await this.userService.create(obj);

      /*
       * Ya no se emite un access_token para el usuario creado: quien llama
       * es un SUPER_ADMIN y no debe recibir una sesión de otra persona.
       * El usuario nuevo inicia sesión por su cuenta (el front no usaba
       * este token).
       */
      return {
        usuario: { ...nuevoUsuario, contrasena: undefined }, // No devolver pass
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throwFatalError(error, this.logger, 'auth-register');
    }
  }
}
