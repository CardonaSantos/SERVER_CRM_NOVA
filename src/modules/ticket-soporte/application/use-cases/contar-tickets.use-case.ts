import { Inject, Injectable } from '@nestjs/common';
import { TicketRangoFechasInvalidoError } from '../../domain/errors/ticket-soporte.errors';
import {
  ContadoresBandeja,
  contarBandejas,
} from '../../domain/policies/fase-ticket.policy';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import { TicketFiltros } from '../../domain/read-models/ticket-listado.read-model';

/** Totales de cada bandeja con los mismos filtros de la lista. */
@Injectable()
export class ContarTicketsUseCase {
  constructor(
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
  ) {}

  async execute(filtros: TicketFiltros): Promise<ContadoresBandeja> {
    if (filtros.desde && filtros.hasta && filtros.hasta < filtros.desde) {
      throw new TicketRangoFechasInvalidoError();
    }

    return contarBandejas(await this.consulta.contarPorEstado(filtros));
  }
}
