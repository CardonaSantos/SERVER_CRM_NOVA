import {
  createParamDecorator,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import type { Request } from 'express';

import type { UsuarioAutenticado } from '../JwtGuard/jwt-payload';

/**
 * Quién hace la petición, listo para pasarlo a un caso de uso
 * (estándar §7.1). Reemplaza los tipos `AuthenticatedRequest` locales y la
 * lectura manual de `x-forwarded-for`.
 */
export type ActorHttp = {
  usuarioId: number;

  /** Viene de la BD. Una empresa por BD: no es filtro de seguridad. */
  empresaId: number;

  /** Viene de la BD en cada petición. */
  rol: string;

  nombre: string;

  sesionId: string;

  /**
   * IP real del cliente: `req.ip` con `trust proxy` 1 (Railway). Nunca se
   * lee `x-forwarded-for` a mano: su primer valor lo puede inventar el cliente.
   */
  ip: string | null;

  userAgent: string | null;
};

const MAX_USER_AGENT = 500;

type PeticionConUsuario = Request & { user?: Partial<UsuarioAutenticado> };

export function construirActorHttp(req: PeticionConUsuario): ActorHttp {
  const usuario = req.user;
  const usuarioId = Number(usuario?.id);

  if (!usuario || !Number.isInteger(usuarioId) || usuarioId <= 0) {
    throw new UnauthorizedException(
      'No fue posible identificar al usuario autenticado.',
    );
  }

  const userAgent = req.headers?.['user-agent'];
  const userAgentLimpio =
    typeof userAgent === 'string' && userAgent.trim()
      ? userAgent.trim().slice(0, MAX_USER_AGENT)
      : null;

  return {
    usuarioId,
    empresaId: Number(usuario.empresaId),
    rol: String(usuario.rol ?? ''),
    nombre: String(usuario.nombre ?? ''),
    sesionId: String(usuario.sesionId ?? ''),
    ip: req.ip?.trim() || null,
    userAgent: userAgentLimpio,
  };
}

/**
 * Inyecta el `ActorHttp` de la petición.
 *
 * @example
 * @Patch(':id')
 * renombrar(@Param('id', ParseIntPipe) id: number, @Actor() actor: ActorHttp) {
 *   return this.renombrarZona.execute({ usuarioId: actor.usuarioId, zonaId: id, … });
 * }
 */
export const Actor = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): ActorHttp =>
    construirActorHttp(ctx.switchToHttp().getRequest<PeticionConUsuario>()),
);
