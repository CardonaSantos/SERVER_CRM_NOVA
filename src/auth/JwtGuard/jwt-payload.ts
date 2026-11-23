import { UnauthorizedException } from '@nestjs/common';

/**
 * Métodos de autenticación (RFC 8176): 'pwd' = contraseña en el login;
 * 'reauth' = el usuario volvió a confirmar su contraseña (step-up, D8).
 */
export type MetodoAutenticacion = 'pwd' | 'reauth';

/**
 * Claims del access token que firma SesionesService.
 */
export interface JwtPayload {
  sub?: number;

  id?: number;

  nombre: string;

  correo: string;

  rol: string;

  activo: boolean;

  empresaId: number;

  /** Id de SesionUsuario: el guard la consulta en cada petición. */
  sid?: string;

  amr?: MetodoAutenticacion[];

  /** Segundos epoch de la última vez que el usuario presentó contraseña. */
  auth_time?: number;

  iat?: number;

  exp?: number;
}

/**
 * Forma de `req.user` en las rutas protegidas. Es el contrato que ya
 * consumen los controladores: no quitar ni renombrar campos.
 * rol/activo/empresaId salen de la BD (no del token congelado).
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

  sesionId: string;

  amr: MetodoAutenticacion[];

  /** Segundos epoch; ver JwtPayload.auth_time. */
  authTime: number | null;
}

/**
 * Valida los claims de un token ya verificado (firma y vencimiento) y
 * construye `req.user`. El guard completa rol/activo/empresaId con la BD.
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

  /*
   * Sin sesión no hay forma de revocar el token: se rechaza (incluye los
   * emitidos antes de la etapa 7).
   */
  if (typeof payload.sid !== 'string' || payload.sid.length === 0) {
    throw new UnauthorizedException('Token sin sesión.');
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

    sesionId: payload.sid,

    amr: Array.isArray(payload.amr) ? payload.amr : [],

    authTime: typeof payload.auth_time === 'number' ? payload.auth_time : null,
  };
}
