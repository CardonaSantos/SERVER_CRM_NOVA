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
import * as bcrypt from 'bcryptjs'; // Asegúrate de usar siempre bcryptjs
import { throwFatalError } from 'src/Utils/CommonFatalError';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  // Helper para limpiar entradas (CRÍTICO PARA PRODUCCIÓN)
  private sanitizeEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  async validarUsuario(correo: string, contrasena: string): Promise<any> {
    const cleanEmail = this.sanitizeEmail(correo);

    // Log para depuración en Railway
    this.logger.log(`Intentando validar usuario: "${cleanEmail}"`);

    const usuario = await this.userService.findByGmail(cleanEmail);

    if (!usuario) {
      this.logger.warn(
        `Intento de login fallido: Usuario no encontrado con email ${cleanEmail}`,
      );
      // Retornamos null para manejar el error genérico abajo y no dar pistas al hacker
      return null;
    }

    // Comparamos contraseña
    const isMatch = await bcrypt.compare(contrasena, usuario.contrasena);

    if (!isMatch) {
      this.logger.warn(
        `Intento de login fallido: Contraseña incorrecta para ${cleanEmail}`,
      );
      return null;
    }

    this.logger.log(`Usuario validado correctamente: ${usuario.id}`);

    // Eliminamos la contraseña del objeto retornado por seguridad
    const { contrasena: _, ...result } = usuario;
    return result;
  }

  async login(correo: string, contrasena: string) {
    try {
      const usuario = await this.validarUsuario(correo, contrasena);

      if (!usuario) {
        // Error genérico para el cliente (Seguridad)
        throw new UnauthorizedException('Credenciales inválidas');
      }

      const payload = {
        sub: usuario.id, // Estándar JWT 'sub' es el ID
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        activo: usuario.activo,
        empresaId: usuario.empresaId,
        id: usuario.id,
      };

      return {
        access_token: this.jwtService.sign(payload),
        user: usuario, // Opcional: devolver info del usuario (sin pass)
      };
    } catch (error) {
      // Si ya es una excepción controlada, la lanzamos
      if (error instanceof UnauthorizedException) throw error;
      throwFatalError(error, this.logger, 'auth-login');
    }
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

      // 2. Hashear contraseña
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(contrasena, salt);

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
