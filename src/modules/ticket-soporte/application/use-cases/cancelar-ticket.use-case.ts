import { Injectable } from '@nestjs/common';
import { TicketSoporteHistorialTipo } from 'src/modules/ticket-soporte-historial/public/ticket-soporte-historial.types';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type CancelarTicketInput = ActorTicket & {
  ticketId: number;
  motivo: string;
};

/** Un ticket nunca se borra: se cancela y queda el motivo. */
@Injectable()
export class CancelarTicketUseCase {
  constructor(private readonly transicion: TransicionTicketService) {}

  execute({
    ticketId,
    motivo,
    ...actor
  }: CancelarTicketInput): Promise<TransicionResult> {
    return this.transicion.ejecutar(
      AccionTicket.CANCELAR,
      ticketId,
      actor,
      async (ticket, { ahora }) => {
        ticket.cancelar(motivo, actor.usuarioId, ahora);

        return {
          tipo: TicketSoporteHistorialTipo.CANCELADO,
          descripcion: 'Ticket cancelado',
          cambios: [
            {
              campo: 'otro',
              etiqueta: 'Motivo',
              anterior: null,
              nuevo: motivo.trim(),
            },
          ],
        };
      },
    );
  }
}
