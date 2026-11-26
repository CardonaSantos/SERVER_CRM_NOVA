import {
  TicketConformidadDetalleReadModel,
  TicketConformidadHistorialReadModel,
} from '../read-models/ticket-soporte-conformidad.read-model';

export const TICKET_CONFORMIDAD_QUERY = Symbol('TICKET_CONFORMIDAD_QUERY');

export interface TicketConformidadQueryPort {
  findDetalleById(
    conformidadId: number,
  ): Promise<TicketConformidadDetalleReadModel | null>;

  /** El ciclo más reciente del ticket. */
  findLatestDetalleByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadDetalleReadModel | null>;

  /** Todos los ciclos del ticket, o `null` si el ticket no existe. */
  findHistorialByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadHistorialReadModel | null>;
}
