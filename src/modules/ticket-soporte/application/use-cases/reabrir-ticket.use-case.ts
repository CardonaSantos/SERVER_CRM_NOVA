import { Inject, Injectable } from '@nestjs/common';
import { TicketSoporteHistorialTipo } from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type ReabrirTicketInput = ActorTicket & { ticketId: number };

/** Un ticket resuelto o cancelado vuelve a abierto y suma una reapertura. */
@Injectable()
export class ReabrirTicketUseCase {
  constructor(
    private readonly transicion: TransicionTicketService,
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
  ) {}

  execute({
    ticketId,
    ...actor
  }: ReabrirTicketInput): Promise<TransicionResult> {
    return this.transicion.ejecutar(
      AccionTicket.REABRIR,
      ticketId,
      actor,
      async (ticket, { ahora }) => {
        ticket.reabrir(ahora);
        await this.tickets.registrarReapertura(ticketId);

        return {
          tipo: TicketSoporteHistorialTipo.REABIERTO,
          descripcion: 'Ticket reabierto',
        };
      },
    );
  }
}
