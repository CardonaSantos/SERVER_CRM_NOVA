import { Inject, Injectable } from '@nestjs/common';
import { TicketConformidadTicketNoEncontradoError } from '../../domain/errors/ticket-soporte-conformidad.errors';
import {
  TICKET_CONFORMIDAD_QUERY,
  TicketConformidadQueryPort,
} from '../../domain/ports/ticket-conformidad-query.port';
import { TicketConformidadHistorialReadModel } from '../../domain/read-models/ticket-soporte-conformidad.read-model';

@Injectable()
export class ObtenerHistorialConformidadTicketUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_QUERY)
    private readonly consulta: TicketConformidadQueryPort,
  ) {}

  /** Todos los ciclos de conformidad del ticket y su resumen. */
  async execute(
    ticketId: number,
  ): Promise<TicketConformidadHistorialReadModel> {
    const historial = await this.consulta.findHistorialByTicketId(ticketId);

    if (!historial) throw new TicketConformidadTicketNoEncontradoError();

    return historial;
  }
}
