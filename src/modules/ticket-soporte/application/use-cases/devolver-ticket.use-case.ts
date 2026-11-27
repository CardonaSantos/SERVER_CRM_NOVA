import { Injectable } from '@nestjs/common';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type DevolverTicketInput = ActorTicket & { ticketId: number };

/** Regresa a abierto un ticket en proceso o en revisión. */
@Injectable()
export class DevolverTicketUseCase {
  constructor(private readonly transicion: TransicionTicketService) {}

  execute({
    ticketId,
    ...actor
  }: DevolverTicketInput): Promise<TransicionResult> {
    return this.transicion.ejecutar(
      AccionTicket.DEVOLVER,
      ticketId,
      actor,
      async (ticket, { ahora }) => {
        ticket.devolver(ahora);

        return { descripcion: 'Devuelto a abierto' };
      },
    );
  }
}
