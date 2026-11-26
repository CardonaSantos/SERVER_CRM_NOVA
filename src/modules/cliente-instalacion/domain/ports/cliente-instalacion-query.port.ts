import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { ClienteInstalacionDetalle } from '../read-models/cliente-instalacion-detalle.read-model';
import {
  ClienteInstalacionAsignadasFiltros,
  ClienteInstalacionAssignedListItem,
  ClienteInstalacionFiltros,
  ClienteInstalacionListItem,
} from '../read-models/cliente-instalacion-listado.read-model';
import { ClienteInstalacionTechnicalDetail } from '../read-models/instalacion-tecnica.read-model';

export const CLIENTE_INSTALACION_QUERY = Symbol('CLIENTE_INSTALACION_QUERY');

export interface ClienteInstalacionQueryPort {
  findDetailById(id: number): Promise<ClienteInstalacionDetalle | null>;

  findMany(
    filtros: ClienteInstalacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteInstalacionListItem>>;

  /** Instalaciones donde el técnico participa con cualquier rol. */
  findAsignadasAlTecnico(
    filtros: ClienteInstalacionAsignadasFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteInstalacionAssignedListItem>>;

  /** Detalle técnico solo si el actor figura asignado a la instalación. */
  findTechnicalDetailById(
    instalacionId: number,
    actorId: number,
  ): Promise<ClienteInstalacionTechnicalDetail | null>;
}
