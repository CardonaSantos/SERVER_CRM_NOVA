import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  TicketSoporteHistorialFiltros,
  TicketSoporteHistorialResumen,
} from '../read-models/ticket-soporte-historial.read-model';

export const TICKET_SOPORTE_HISTORIAL_QUERY = Symbol(
  'TICKET_SOPORTE_HISTORIAL_QUERY',
);

export interface TicketSoporteHistorialQueryPort {
  /** Listado paginado; `total` cuadra con `items` para los mismos filtros. */
  findMany(
    filtros: TicketSoporteHistorialFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TicketSoporteHistorialResumen>>;

  findById(id: number): Promise<TicketSoporteHistorialResumen | null>;
}
