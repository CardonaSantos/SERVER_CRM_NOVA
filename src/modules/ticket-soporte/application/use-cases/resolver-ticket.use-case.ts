import { Inject, Injectable, Logger } from '@nestjs/common';
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
import { METAS_TICKET, MetasTicketPort } from '../ports/metas-ticket.port';
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
  private readonly logger = new Logger(ResolverTicketUseCase.name);

  constructor(
    private readonly transicion: TransicionTicketService,
    @Inject(TICKET_REPOSITORY)
    private readonly tickets: TicketRepositoryPort,
    @Inject(TICKET_REFERENCIA_QUERY)
    private readonly referencias: TicketReferenciaQueryPort,
    @Inject(METAS_TICKET) private readonly metas: MetasTicketPort,
  ) {}

  async execute(input: ResolverTicketInput): Promise<TransicionResult> {
    const { ticketId, solucionId, resueltoComo, notasInternas, ...actor } =
      input;
    // Solo el primer cierre cuenta para las metas.
    let paraMetas: number[] = [];

    const result = await this.transicion.ejecutar(
      AccionTicket.RESOLVER,
      ticketId,
      actor,
      async (ticket, { ahora, ciclos, huboTrabajo }) => {
        let solucion: string | null = null;

        if (solucionId) {
          solucion = await this.referencias.solucionVigente(solucionId);
          if (!solucion) throw new TicketSolucionNoDisponibleError();
        }

        if ((await this.tickets.reaperturas(ticketId)) === 0) {
          paraMetas = ticket.asignados;
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

    await this.sumarMetas(ticketId, paraMetas);

    return result;
  }

  private async sumarMetas(ticketId: number, tecnicos: number[]) {
    const resultados = await Promise.allSettled(
      tecnicos.map((id) => this.metas.sumarResuelto(id)),
    );
    const fallidas = resultados.filter((r) => r.status === 'rejected').length;

    if (fallidas) {
      this.logger.warn(
        `Ticket ${ticketId} resuelto, pero ${fallidas} metas no se actualizaron.`,
      );
    }
  }
}
