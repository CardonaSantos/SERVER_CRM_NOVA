import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolUsuario } from '@prisma/client';

import { ROLES_PERMITIDOS } from '../decoradores/roles.decorator';
import { UsuarioAutenticado } from './jwt-payload';
import { JwtAuthGuard } from './jwt-auth.guard';

/**
 * Autorización por rol (APP_GUARD, corre después de GuardGlobalAuth).
 *
 * Solo actúa en rutas con @Roles(...). Una ruta con @Roles siempre exige
 * usuario autenticado, aunque el guard global esté en modo observación:
 * declarar roles es declarar la ruta como protegida. El rol sale de la BD
 * (JwtAuthGuard lo refresca en cada petición).
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;

    const permitidos = this.reflector.getAllAndOverride<RolUsuario[]>(
      ROLES_PERMITIDOS,
      [context.getHandler(), context.getClass()],
    );

    if (!permitidos || permitidos.length === 0) return true;

    const request = context
      .switchToHttp()
      .getRequest<{ user?: UsuarioAutenticado }>();

    // En observación el guard global deja pasar sin usuario: aquí no.
    // (Idempotente: si ya se autenticó, no repite la consulta.)
    if (!request.user) {
      await this.jwtAuthGuard.canActivate(context);
    }

    const rol = request.user?.rol;

    if (!rol) {
      throw new UnauthorizedException();
    }

    if (!permitidos.includes(rol as RolUsuario)) {
      throw new ForbiddenException('No tiene permisos para esta operación.');
    }

    return true;
  }
}
