import {
  DireccionOrden,
  Paginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoTicket } from '../enums/estado-ticket.enum';
import { OpcionesTicket } from '../read-models/catalogo-ticket.read-model';
import { ActividadTicket } from '../read-models/ticket-actividad.read-model';
import { TicketBoletaReadModel } from '../read-models/ticket-boleta.read-model';
import { TicketDetalleReadModel } from '../read-models/ticket-detalle.read-model';
import {
  TicketFiltros,
  TicketListItem,
} from '../read-models/ticket-listado.read-model';

export const TICKET_QUERY = Symbol('TICKET_QUERY');

export interface TicketQueryPort {
  /** Fijados primero; el resto según la bandeja o el orden pedido. */
  findMany(
    filtros: TicketFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TicketListItem>>;

  /** Totales por estado con los mismos filtros, sin contar la bandeja. */
  contarPorEstado(
    filtros: TicketFiltros,
  ): Promise<Array<{ estado: EstadoTicket; total: number }>>;

  findDetail(ticketId: number): Promise<TicketDetalleReadModel | null>;

  /** Bitácora y comentarios en una sola línea de tiempo. */
  findActividad(
    ticketId: number,
    paginacion: Paginacion,
    sortDir: DireccionOrden,
  ): Promise<ResultadoPaginado<ActividadTicket>>;

  findBoleta(
    ticketId: number,
    empresaPorDefectoId: number,
  ): Promise<TicketBoletaReadModel | null>;

  findOpciones(): Promise<OpcionesTicket>;
}
