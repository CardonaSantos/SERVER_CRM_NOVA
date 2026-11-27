import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  CatalogoTicketFiltros,
  EtiquetaTicketListItem,
  SolucionTicketListItem,
} from '../read-models/catalogo-ticket.read-model';

export const CATALOGO_TICKET_QUERY = Symbol('CATALOGO_TICKET_QUERY');

/** Listados de etiquetas y soluciones vigentes. */
export interface CatalogoTicketQueryPort {
  findEtiquetas(
    filtros: CatalogoTicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EtiquetaTicketListItem>>;

  findSoluciones(
    filtros: CatalogoTicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<SolucionTicketListItem>>;
}
