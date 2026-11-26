import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { ClienteDesinstalacionQueryPort } from '../../domain/ports/cliente-desinstalacion-query.port';
import {
  ClienteDesinstalacionDetalle,
  ClienteDesinstalacionFiltros,
  ClienteDesinstalacionListadoItem,
} from '../../domain/read-models/cliente-desinstalacion.read-model';

export class ClienteDesinstalacionQueryFake
  implements ClienteDesinstalacionQueryPort
{
  readonly detalles = new Map<number, ClienteDesinstalacionDetalle>();
  filtrosRecibidos: ClienteDesinstalacionFiltros | null = null;
  paginacionRecibida: Paginacion | null = null;

  findDetalleById(id: number): Promise<ClienteDesinstalacionDetalle | null> {
    return Promise.resolve(this.detalles.get(id) ?? null);
  }

  findMany(
    filtros: ClienteDesinstalacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteDesinstalacionListadoItem>> {
    this.filtrosRecibidos = filtros;
    this.paginacionRecibida = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }
}
