import { Injectable } from '@nestjs/common';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type EnviarTicketARevisionInput = ActorTicket & { ticketId: number };

/** El trabajo técnico terminó: detiene el reloj y espera a la oficina. */
@Injectable()
export class EnviarTicketARevisionUseCase {
  constructor(private readonly transicion: TransicionTicketService) {}

  execute({
    ticketId,
    ...actor
  }: EnviarTicketARevisionInput): Promise<TransicionResult> {
    return this.transicion.ejecutar(
      AccionTicket.ENVIAR_REVISION,
      ticketId,
      actor,
      async (ticket, { ahora }) => {
        ticket.enviarARevision(ahora);

        return { descripcion: 'Enviado a revisión' };
      },
    );
  }
}
