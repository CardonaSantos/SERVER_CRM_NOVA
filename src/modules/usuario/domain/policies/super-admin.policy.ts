import { RolUsuario } from '../enums/rol-usuario.enum';
import {
  UsuarioAccionSobreSiMismoError,
  UsuarioUltimoSuperAdminError,
} from '../errors/usuario.errors';

export type SituacionUsuario = {
  rol: RolUsuario;
  activo: boolean;
  eliminado: boolean;
};

export function situacionDe(usuario: SituacionUsuario): SituacionUsuario {
  return {
    rol: usuario.rol,
    activo: usuario.activo,
    eliminado: usuario.eliminado,
  };
}

function cuentaComoSuperAdmin(usuario: SituacionUsuario): boolean {
  return (
    usuario.rol === RolUsuario.SUPER_ADMIN &&
    usuario.activo &&
    !usuario.eliminado
  );
}

/**
 * Regla de datos, no de permisos: el sistema nunca se queda sin un super
 * administrador activo, que es el único que gestiona usuarios.
 *
 * @param superAdminsActivos Cuántos hay antes del cambio.
 */
export function asegurarQueQuedaSuperAdmin(
  antes: SituacionUsuario,
  despues: SituacionUsuario,
  superAdminsActivos: number,
): void {
  if (
    cuentaComoSuperAdmin(antes) &&
    !cuentaComoSuperAdmin(despues) &&
    superAdminsActivos <= 1
  ) {
    throw new UsuarioUltimoSuperAdminError();
  }
}

/** Desactivar, eliminar, cambiar el rol o la contraseña propios no se hace aquí. */
export function asegurarQueNoEsUnoMismo(
  actorId: number,
  usuarioId: number,
): void {
  if (actorId === usuarioId) throw new UsuarioAccionSobreSiMismoError();
}
