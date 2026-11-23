import {
  Injectable,
  Logger,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from 'src/user/app/user.service';
import { JwtService } from '@nestjs/jwt';
import { throwFatalError } from 'src/Utils/CommonFatalError';
import { PrismaService } from 'src/prisma/prisma.service';
import { PasswordService } from './password/password.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly passwordService: PasswordService,
    private readonly prisma: PrismaService,
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

  async validarUsuario(correo: string, contrasena: string): Promise<any> {
    const cleanEmail = this.sanitizeEmail(correo);

    // Nunca registrar el correo: es dato personal y ayuda a enumerar cuentas.
    const usuario = await this.userService.findByGmail(cleanEmail);

    if (!usuario) {
      this.logger.warn('Intento de login fallido: usuario no encontrado');
      // Retornamos null para manejar el error genérico abajo y no dar pistas al hacker
      return null;
    }

    if (!usuario.activo) {
      this.logger.warn(
        `Intento de login de usuario desactivado: ${usuario.id}`,
      );

      throw new UnauthorizedException('Este usuario está desactivado');
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
      return null;
    }

    this.logger.log(`Usuario validado correctamente: ${usuario.id}`);

    await this.rehashSiHaceFalta(usuario.id, contrasena, usuario.contrasena);

    // Eliminamos la contraseña del objeto retornado por seguridad
    const { contrasena: _, ...result } = usuario;
    return result;
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

  async login(correo: string, contrasena: string) {
    try {
      const usuario = await this.validarUsuario(correo, contrasena);

      if (!usuario) {
        throw new UnauthorizedException('Credenciales inválidas');
      }

      /*
       * El login y GET /auth/profile deben
       * compartir el mismo contrato público.
       */
      const publicUser = await this.getAuthenticatedProfile(usuario.id);

      const payload = {
        sub: publicUser.id,

        id: publicUser.id,

        nombre: publicUser.nombre,

        correo: publicUser.correo,

        rol: publicUser.rol,

        activo: publicUser.activo,

        empresaId: publicUser.empresaId,
      };

      return {
        access_token: this.jwtService.sign(payload),

        user: publicUser,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throwFatalError(error, this.logger, 'auth-login');
    }
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

      // 4. Login automático (Generar token)
      const payload = {
        sub: nuevoUsuario.id,
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
        activo: nuevoUsuario.activo,
        empresaId: nuevoUsuario.empresaId,
        id: nuevoUsuario.id,
      };

      return {
        usuario: { ...nuevoUsuario, contrasena: undefined }, // No devolver pass
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      throwFatalError(error, this.logger, 'auth-register');
    }
  }
}
