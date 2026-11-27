import { Injectable } from '@nestjs/common';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type IniciarTicketInput = ActorTicket & { ticketId: number };

/** Inicia o reanuda la atención y arranca el reloj. */
@Injectable()
export class IniciarTicketUseCase {
  constructor(private readonly transicion: TransicionTicketService) {}

  execute({
    ticketId,
    ...actor
  }: IniciarTicketInput): Promise<TransicionResult> {
    return this.transicion.ejecutar(
      AccionTicket.INICIAR,
      ticketId,
      actor,
      async (ticket, { ahora }) => {
        ticket.iniciar(ahora);

        return { descripcion: 'Atención iniciada' };
      },
    );
  }
}
