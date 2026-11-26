import { TicketSoporteContextoQueryPort } from '../../domain/ports/ticket-soporte-contexto-query.port';
import { TicketSoporteContextoReadModel } from '../../domain/read-models/ticket-soporte-conformidad.read-model';

export class TicketSoporteContextoQueryFake
  implements TicketSoporteContextoQueryPort
{
  readonly tickets = new Map<number, TicketSoporteContextoReadModel>();

  /** Un ticket con cliente, técnico y empresa salvo que se indique otra cosa. */
  sembrar(
    cambios: Partial<TicketSoporteContextoReadModel> = {},
  ): TicketSoporteContextoReadModel {
    const ticket: TicketSoporteContextoReadModel = {
      ticketId: 10,
      empresaId: 1,
      clienteId: 5,
      tecnicoId: 7,
      ...cambios,
    };

    this.tickets.set(ticket.ticketId, ticket);

    return ticket;
  }

  findContextById(
    ticketId: number,
  ): Promise<TicketSoporteContextoReadModel | null> {
    return Promise.resolve(this.tickets.get(ticketId) ?? null);
  }
}
