import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

interface JwtPayload {
  sub?: number;

  id?: number;

  nombre: string;

  correo: string;

  rol: string;

  activo: boolean;

  empresaId: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      ignoreExpiration: false,

      secretOrKey: process.env.MY_SECRET_TOKEN_KEY_CRM,
    });
  }

  validate(payload: JwtPayload) {
    const id = Number(payload.id ?? payload.sub);

    if (!Number.isInteger(id) || id <= 0) {
      throw new UnauthorizedException(
        'El token no contiene un usuario válido.',
      );
    }

    return {
      /*
       * Estructura normalizada para controladores nuevos.
       */
      id,

      sub: Number(payload.sub ?? id),

      /*
       * Compatibilidad con código anterior.
       */
      userId: id,

      nombre: payload.nombre,

      correo: payload.correo,

      rol: payload.rol,

      activo: payload.activo,

      empresaId: payload.empresaId,
    };
  }
}
