import {
  TicketConformidadDetalleReadModel,
  TicketConformidadHistorialReadModel,
} from '../models/ticket-conformidad-read.model';

export const TICKET_CONFORMIDAD_QUERY_PORT = Symbol(
  'TICKET_CONFORMIDAD_QUERY_PORT',
);

export interface TicketConformidadQueryPort {
  /**
   * Obtiene una conformidad concreta con sus relaciones
   * necesarias para UI, administración y reportería.
   */
  findDetalleById(
    conformidadId: number,
  ): Promise<TicketConformidadDetalleReadModel | null>;

  /**
   * Obtiene el último ciclo de conformidad de un ticket.
   */
  findLatestDetalleByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadDetalleReadModel | null>;

  /**
   * Obtiene todos los ciclos de conformidad del ticket,
   * incluyendo relaciones y resumen histórico.
   */
  findHistorialByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadHistorialReadModel | null>;
}
