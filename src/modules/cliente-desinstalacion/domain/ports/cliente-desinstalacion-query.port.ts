import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  ClienteDesinstalacionDetalle,
  ClienteDesinstalacionFiltros,
  ClienteDesinstalacionListadoItem,
} from '../read-models/cliente-desinstalacion.read-model';

export const CLIENTE_DESINSTALACION_QUERY = Symbol(
  'CLIENTE_DESINSTALACION_QUERY',
);

export interface ClienteDesinstalacionQueryPort {
  findDetalleById(id: number): Promise<ClienteDesinstalacionDetalle | null>;

  findMany(
    filtros: ClienteDesinstalacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClienteDesinstalacionListadoItem>>;
}
