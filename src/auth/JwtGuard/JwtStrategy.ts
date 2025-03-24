import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

// Interfaz que define la carga útil (payload) del JWT
interface JwtPayload {
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  empresaId: number;
  id: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Extrae el token del header Authorization
      ignoreExpiration: false, // Si quieres que el token expire correctamente
      secretOrKey: process.env.MY_SECRET_TOKEN_KEY_CRM, // Usa la clave secreta para verificar el JWT
    });
  }

  async validate(payload: JwtPayload) {
    // Aquí devuelves los datos que el guardia o controlador utilizará
    console.log('ayload', payload);

    return {
      userId: payload.id,
      nombre: payload.nombre,
      correo: payload.correo,
      rol: payload.rol,
      activo: payload.activo,
      empresaId: payload.empresaId,
    };
  }
}
