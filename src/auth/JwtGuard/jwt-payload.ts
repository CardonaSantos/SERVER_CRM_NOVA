import { UnauthorizedException } from '@nestjs/common';

/**
 * Claims que firma AuthService (login y registro).
 */
export interface JwtPayload {
  sub?: number;

  id?: number;

  nombre: string;

  correo: string;

  rol: string;

  activo: boolean;

  empresaId: number;

  iat?: number;

  exp?: number;
}

/**
 * Forma de `req.user` en las rutas protegidas. Es el contrato que ya
 * consumen los controladores: no cambiar sus campos.
 */
export interface UsuarioAutenticado {
  /** Estructura normalizada para controladores nuevos. */
  id: number;

  sub: number;

  /** Compatibilidad con código anterior. */
  userId: number;

  nombre: string;

  correo: string;

  rol: string;

  activo: boolean;

  empresaId: number;
}

/**
 * Valida los claims de un token ya verificado (firma y vencimiento) y
 * construye `req.user`.
 */
export function construirUsuarioAutenticado(
  payload: JwtPayload,
): UsuarioAutenticado {
  /*
   * jsonwebtoken solo revisa la expiración si el claim `exp` existe.
   * Los tokens emitidos antes de expiresIn no lo traen y serían válidos
   * para siempre: se rechazan.
   */
  if (typeof payload.exp !== 'number') {
    throw new UnauthorizedException('Token sin expiración.');
  }

  const id = Number(payload.id ?? payload.sub);

  if (!Number.isInteger(id) || id <= 0) {
    throw new UnauthorizedException('El token no contiene un usuario válido.');
  }

  return {
    id,

    sub: Number(payload.sub ?? id),

    userId: id,

    nombre: payload.nombre,

    correo: payload.correo,

    rol: payload.rol,

    activo: payload.activo,

    empresaId: payload.empresaId,
  };
}
