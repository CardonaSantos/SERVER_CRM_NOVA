import { TicketConformidadEntity } from '../entities/ticket-conformidad.entity';

export const TICKET_CONFORMIDAD_REPOSITORY = Symbol(
  'TICKET_CONFORMIDAD_REPOSITORY',
);

export interface TicketConformidadRepositoryPort {
  /** Persiste un ciclo de conformidad nuevo. */
  create(entity: TicketConformidadEntity): Promise<TicketConformidadEntity>;

  findById(id: number): Promise<TicketConformidadEntity | null>;

  /** Ciclo PENDIENTE del ticket, para no abrir dos a la vez. */
  findPendingByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null>;
}
