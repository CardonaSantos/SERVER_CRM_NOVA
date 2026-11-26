import { Inject, Injectable } from '@nestjs/common';
import { TicketSinConformidadError } from '../../domain/errors/ticket-soporte-conformidad.errors';
import {
  TICKET_CONFORMIDAD_QUERY,
  TicketConformidadQueryPort,
} from '../../domain/ports/ticket-conformidad-query.port';
import { TicketConformidadDetalleReadModel } from '../../domain/read-models/ticket-soporte-conformidad.read-model';

@Injectable()
export class ObtenerConformidadActualTicketUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_QUERY)
    private readonly consulta: TicketConformidadQueryPort,
  ) {}

  /** El ciclo de conformidad más reciente del ticket. */
  async execute(ticketId: number): Promise<TicketConformidadDetalleReadModel> {
    const detalle = await this.consulta.findLatestDetalleByTicketId(ticketId);

    if (!detalle) throw new TicketSinConformidadError();

    return detalle;
  }
}
