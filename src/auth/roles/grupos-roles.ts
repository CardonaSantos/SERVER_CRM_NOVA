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

/** Todos menos el técnico: asignan y fijan tickets de soporte. */
export const ROLES_SIN_TECNICO: RolUsuario[] = Object.values(RolUsuario).filter(
  (rol) => rol !== RolUsuario.TECNICO,
);

/** Si un rol (tal como llega en el actor) pertenece a un grupo. */
export function perteneceA(grupo: RolUsuario[], rol: string): boolean {
  return grupo.some((permitido) => permitido === rol);
}
