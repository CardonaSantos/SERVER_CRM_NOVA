import { SetMetadata } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';

export const ROLES_PERMITIDOS = 'auth:rolesPermitidos';

/**
 * Restringe la ruta (o el controlador) a los roles indicados. Lo aplica
 * RolesGuard (global) con el rol leído de la BD en cada petición, no el
 * congelado en el token. Sin @Roles, la ruta no tiene restricción de rol.
 */
export const Roles = (...roles: RolUsuario[]) =>
  SetMetadata(ROLES_PERMITIDOS, roles);
