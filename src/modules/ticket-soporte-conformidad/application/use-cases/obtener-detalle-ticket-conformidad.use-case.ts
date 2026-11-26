import { Inject, Injectable } from '@nestjs/common';
import { TicketConformidadNoEncontradaError } from '../../domain/errors/ticket-soporte-conformidad.errors';
import {
  TICKET_CONFORMIDAD_QUERY,
  TicketConformidadQueryPort,
} from '../../domain/ports/ticket-conformidad-query.port';
import { TicketConformidadDetalleReadModel } from '../../domain/read-models/ticket-soporte-conformidad.read-model';

@Injectable()
export class ObtenerDetalleTicketConformidadUseCase {
  constructor(
    @Inject(TICKET_CONFORMIDAD_QUERY)
    private readonly consulta: TicketConformidadQueryPort,
  ) {}

  async execute(
    conformidadId: number,
  ): Promise<TicketConformidadDetalleReadModel> {
    const detalle = await this.consulta.findDetalleById(conformidadId);

    if (!detalle) throw new TicketConformidadNoEncontradaError();

    return detalle;
  }
}
