import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  FacturaDetalle,
  FacturaEdicion,
  FacturaEliminadaItem,
  FacturaFiltros,
  FacturaImpresion,
  FacturaListItem,
  ResumenFacturas,
} from '../read-models/factura.read-model';

export const FACTURA_QUERY = Symbol('FACTURA_QUERY');

export interface FacturaQueryPort {
  /** De la más nueva a la más vieja. */
  findMany(
    filtros: FacturaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<FacturaListItem>>;

  resumir(filtros: FacturaFiltros): Promise<ResumenFacturas>;

  findDetalle(id: number): Promise<FacturaDetalle | null>;

  findImpresion(id: number): Promise<FacturaImpresion | null>;

  findEdicion(id: number): Promise<FacturaEdicion | null>;

  /** Bitácora de facturas eliminadas; `search` busca en motivo y periodo. */
  findEliminadas(
    search: string | undefined,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<FacturaEliminadaItem>>;
}
