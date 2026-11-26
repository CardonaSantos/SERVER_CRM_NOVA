import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { ClienteInstalacionQueryPort } from '../../domain/ports/cliente-instalacion-query.port';
import { ClienteInstalacionDetalle } from '../../domain/read-models/cliente-instalacion-detalle.read-model';
import {
  ClienteInstalacionAsignadasFiltros,
  ClienteInstalacionAssignedListItem,
  ClienteInstalacionFiltros,
  ClienteInstalacionListItem,
} from '../../domain/read-models/cliente-instalacion-listado.read-model';
import { ClienteInstalacionTechnicalDetail } from '../../domain/read-models/instalacion-tecnica.read-model';

/** Consultas con respuestas preparadas por la prueba; guarda los filtros que recibe. */
export class ClienteInstalacionQueryFake
  implements ClienteInstalacionQueryPort
{
  readonly detalles = new Map<number, ClienteInstalacionDetalle>();
  readonly tecnicos = new Map<number, ClienteInstalacionTechnicalDetail>();
  filtrosRecibidos: ClienteInstalacionFiltros | null = null;
  filtrosAsignadasRecibidos: ClienteInstalacionAsignadasFiltros | null = null;
  paginacionRecibida: Paginacion | null = null;

  findDetailById(id: number): Promise<ClienteInstalacionDetalle | null> {
    return Promise.resolve(this.detalles.get(id) ?? null);
  }

  findMany(
    filtros: ClienteInstalacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteInstalacionListItem>> {
    this.filtrosRecibidos = filtros;
    this.paginacionRecibida = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }

  findAsignadasAlTecnico(
    filtros: ClienteInstalacionAsignadasFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteInstalacionAssignedListItem>> {
    this.filtrosAsignadasRecibidos = filtros;
    this.paginacionRecibida = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }

  findTechnicalDetailById(
    instalacionId: number,
  ): Promise<ClienteInstalacionTechnicalDetail | null> {
    return Promise.resolve(this.tecnicos.get(instalacionId) ?? null);
  }
}
