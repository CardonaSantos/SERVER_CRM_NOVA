import { RolUsuario } from '@prisma/client';

/**
 * Grupos de roles con nombre para `@Roles(...GRUPO)` (estándar §7.1).
 * Un grupo nuevo se agrega aquí; los controladores no escriben listas.
 */

/** Personal de oficina y administración: operaciones administrativas PPPoE. */
export const ROLES_OFICINA: RolUsuario[] = [
  RolUsuario.SUPER_ADMIN,
  RolUsuario.ADMIN,
  RolUsuario.COORDINADOR_OPERACIONES,
  RolUsuario.OFICINA,
];

/** Técnicos de campo. */
export const ROLES_TECNICO: RolUsuario[] = [RolUsuario.TECNICO];
