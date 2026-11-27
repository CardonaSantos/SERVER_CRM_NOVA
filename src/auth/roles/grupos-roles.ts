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

/** Administración: textos legales como las plantillas de contrato. */
export const ROLES_ADMINISTRACION: RolUsuario[] = [
  RolUsuario.SUPER_ADMIN,
  RolUsuario.ADMIN,
];

/** Configuración de la instalación (datos de la empresa). */
export const ROLES_SUPER_ADMIN: RolUsuario[] = [RolUsuario.SUPER_ADMIN];

/** Técnicos de campo. */
export const ROLES_TECNICO: RolUsuario[] = [RolUsuario.TECNICO];

/** Todos menos el técnico: asignan y fijan tickets de soporte y ven el panel general. */
export const ROLES_SIN_TECNICO: RolUsuario[] = Object.values(RolUsuario).filter(
  (rol) => rol !== RolUsuario.TECNICO,
);

/** Si un rol (tal como llega en el actor) pertenece a un grupo. */
export function perteneceA(grupo: RolUsuario[], rol: string): boolean {
  return grupo.some((permitido) => permitido === rol);
}
