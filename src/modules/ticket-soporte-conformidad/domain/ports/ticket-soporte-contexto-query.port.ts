import { TicketSoporteContextoReadModel } from '../read-models/ticket-soporte-conformidad.read-model';

export const TICKET_SOPORTE_CONTEXTO_QUERY = Symbol(
  'TICKET_SOPORTE_CONTEXTO_QUERY',
);

/** Lectura del ticket de soporte (que vive fuera de este módulo). */
export interface TicketSoporteContextoQueryPort {
  findContextById(
    ticketId: number,
  ): Promise<TicketSoporteContextoReadModel | null>;
}
