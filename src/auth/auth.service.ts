import { Injectable, UnauthorizedException } from '@nestjs/common';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UserService } from 'src/user/user.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

interface Usuario {
  nombre: string;
  correo: string;
  id: number;
  rol: string;
  activo: boolean;
  empresaId: number;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService, ///DE LA DEPENDENCIA
  ) {}

  async validarUsuario(correo: string, contrasena: string): Promise<any> {
    const usuario = await this.userService.findByGmail(correo);
    console.log('Validando usuario con correo:', correo);
    console.log('Usuario encontrado:', usuario);

    if (usuario && (await bcrypt.compare(contrasena, usuario.contrasena))) {
      return usuario;
    }
    throw new UnauthorizedException('Usuario no autorizado');
  }

  async login(correo: string, contrasena: string) {
    try {
      const usuario: Usuario = await this.validarUsuario(correo, contrasena);

      const payload = {
        nombre: usuario.nombre,
        correo: usuario.correo,
        rol: usuario.rol,
        activo: usuario.activo,
        empresaId: usuario.empresaId,
        id: usuario.id,
      };
      console.log('El payload es: ', payload);

      return {
        access_token: this.jwtService.sign(payload), // Genera el token JWT
      };
    } catch (error) {
      console.log('Error en login:', error);
      throw new UnauthorizedException('Credenciales incorrectas');
    }
  }

  // Registrar un nuevo usuario con contraseñas hasheadas
  async register(createAuthDto: CreateAuthDto) {
    try {
      // Hasheamos la contraseña
      console.log('Los datos llegando son: ', createAuthDto);

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(createAuthDto.contrasena, salt);
      const { nombre, rol, correo, empresaId } = createAuthDto;
      // Creamos el usuario
      const nuevoUsuario = await this.userService.create({
        nombre,
        contrasena: hashedPassword,
        rol,
        correo,
        activo: true,
        empresaId,
      });

      //EL PAYLOAD SE PUEDE CREAR CUANDO YA TENEMOS EL USER
      const payload = {
        nombre: nuevoUsuario.nombre,
        correo: nuevoUsuario.correo,
        rol: nuevoUsuario.rol,
        activo: nuevoUsuario.activo,
        empresaId: nuevoUsuario.empresaId,
        id: nuevoUsuario.id,
      };

      const token = this.jwtService.sign(payload);

      return {
        usuario: nuevoUsuario,
        access_token: token,
      };
    } catch (error) {
      console.log('EL ERROR ES: ', error);
    }
  }
}
