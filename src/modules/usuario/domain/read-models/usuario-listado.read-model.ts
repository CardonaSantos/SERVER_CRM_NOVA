import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { EstadoUsuario } from '../enums/estado-usuario.enum';
import { OrdenUsuario } from '../enums/orden-usuario.enum';
import { RolUsuario } from '../enums/rol-usuario.enum';

export type UsuarioFiltros = {
  /** Nombre, correo o teléfono. */
  search?: string;
  roles?: RolUsuario[];
  /** Sin filtro: activos e inactivos (los eliminados se piden aparte). */
  estados?: EstadoUsuario[];
  sortBy?: OrdenUsuario;
  sortDir?: DireccionOrden;
};

export type UsuarioListItem = {
  id: number;
  nombre: string;
  /** El real, también en un eliminado. */
  correo: string;
  telefono: string | null;
  rol: RolUsuario;
  estado: EstadoUsuario;
  avatarUrl: string | null;
  creadoEn: Date;
  actualizadoEn: Date;
  eliminadoEn: Date | null;
};

export type UsuarioDetalle = UsuarioListItem & {
  portadaUrl: string | null;
  /** Sesiones abiertas ahora. */
  sesionesActivas: number;
};

/** Para elegir a alguien en un formulario (técnico, cobrador…). */
export type UsuarioOpcion = {
  id: number;
  nombre: string;
  rol: RolUsuario;
};

/** Lo que `auth` necesita para validar un login. Solo usuarios no eliminados. */
export type CredencialesUsuario = {
  usuarioId: number;
  activo: boolean;
  contrasenaHash: string;
};

/** Datos de la persona con sesión (login y `GET /auth/profile`). */
export type PerfilSesion = {
  id: number;
  nombre: string;
  correo: string;
  rol: RolUsuario;
  activo: boolean;
  empresaId: number;
  avatarUrl: string | null;
  portadaUrl: string | null;
};
