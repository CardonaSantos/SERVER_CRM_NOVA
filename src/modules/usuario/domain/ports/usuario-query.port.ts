import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { RolUsuario } from '../enums/rol-usuario.enum';
import {
  CredencialesUsuario,
  PerfilSesion,
  UsuarioDetalle,
  UsuarioFiltros,
  UsuarioListItem,
  UsuarioOpcion,
} from '../read-models/usuario-listado.read-model';

export const USUARIO_QUERY = Symbol('USUARIO_QUERY');

export interface UsuarioQueryPort {
  /** Sin `estados` no trae eliminados. */
  findMany(
    filtros: UsuarioFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<UsuarioListItem>>;

  /** Incluye eliminados. */
  findDetail(id: number): Promise<UsuarioDetalle | null>;

  /** Activos, por nombre. Sin roles, todos. */
  findOpciones(roles: RolUsuario[]): Promise<UsuarioOpcion[]>;

  /** `null` si no existe o está eliminado. */
  findCredenciales(correo: string): Promise<CredencialesUsuario | null>;

  /** `null` si no existe o está eliminado. */
  findPerfilSesion(id: number): Promise<PerfilSesion | null>;
}
