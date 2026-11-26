import { Inject, Injectable } from '@nestjs/common';
import { TicketSoporteHistorialNoEncontradoError } from '../../domain/errors/ticket-soporte-historial.errors';
import {
  TICKET_SOPORTE_HISTORIAL_QUERY,
  TicketSoporteHistorialQueryPort,
} from '../../domain/ports/ticket-soporte-historial-query.port';
import { TicketSoporteHistorialResumen } from '../../domain/read-models/ticket-soporte-historial.read-model';

@Injectable()
export class ObtenerTicketSoporteHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_QUERY)
    private readonly consulta: TicketSoporteHistorialQueryPort,
  ) {}

  async execute(id: number): Promise<TicketSoporteHistorialResumen> {
    const resumen = await this.consulta.findById(id);

    if (!resumen) throw new TicketSoporteHistorialNoEncontradoError();

    return resumen;
  }
}
