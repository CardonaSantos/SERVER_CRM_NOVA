import { Inject, Injectable } from '@nestjs/common';
import { AccionTicket } from '../../domain/enums/accion-ticket.enum';
import { TicketSolucionNoDisponibleError } from '../../domain/errors/ticket-soporte.errors';
import {
  tiempoTecnico,
  tiempoTotal,
} from '../../domain/policies/tiempos-ticket.policy';
import {
  TICKET_REFERENCIA_QUERY,
  TicketReferenciaQueryPort,
} from '../../domain/ports/ticket-referencia-query.port';
import {
  TICKET_REPOSITORY,
  TicketRepositoryPort,
} from '../../domain/ports/ticket-repository.port';
import {
  ActorTicket,
  TransicionResult,
  TransicionTicketService,
} from '../services/transicion-ticket.service';

export type ResolverTicketInput = ActorTicket & {
  ticketId: number;
  solucionId?: number | null;
  resueltoComo?: string | null;
  notasInternas?: string | null;
};

@Injectable()
export class ResolverTicketUseCase {
  constructor(
    private readonly transicion: TransicionTicketService,
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_REFERENCIA_QUERY)
    private readonly referencias: TicketReferenciaQueryPort,
  ) {}

  async execute(input: ResolverTicketInput): Promise<TransicionResult> {
    const { ticketId, solucionId, resueltoComo, notasInternas, ...actor } =
      input;
    return this.transicion.ejecutar(
      AccionTicket.RESOLVER,
      ticketId,
      actor,
      async (ticket, { ahora, ciclos, huboTrabajo }) => {
        let solucion: string | null = null;

        if (solucionId) {
          solucion = await this.referencias.solucionVigente(solucionId);
          if (!solucion) throw new TicketSolucionNoDisponibleError();
        }

        ticket.resolver(huboTrabajo, ahora);
        await this.tickets.cerrarResumen({
          ticketId,
          solucionId: solucionId ?? null,
          resueltoComo: resueltoComo?.trim() || null,
          notasInternas: notasInternas?.trim() || null,
          tiempoTotalMinutos: tiempoTotal(ticket.fechaApertura, ahora),
          tiempoTecnicoMinutos: tiempoTecnico(ciclos, ahora),
        });

        return {
          descripcion: 'Ticket resuelto',
          cambios: solucion
            ? [
                {
                  campo: 'otro',
                  etiqueta: 'Solución',
                  anterior: null,
                  nuevo: solucion,
                },
              ]
            : [],
        };
      },
    );
  }
}
