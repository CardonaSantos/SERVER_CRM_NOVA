import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { TicketRangoFechasInvalidoError } from '../../domain/errors/ticket-soporte.errors';
import {
  TICKET_QUERY,
  TicketQueryPort,
} from '../../domain/ports/ticket-query.port';
import {
  TicketFiltros,
  TicketListItem,
} from '../../domain/read-models/ticket-listado.read-model';

export type ListarTicketsInput = TicketFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarTicketsUseCase {
  constructor(
    @Inject(TICKET_QUERY) private readonly consulta: TicketQueryPort,
  ) {}

  async execute(
    input: ListarTicketsInput,
  ): Promise<ResultadoPaginado<TicketListItem>> {
    const { page, limit, ...filtros } = input;

    if (filtros.desde && filtros.hasta && filtros.hasta < filtros.desde) {
      throw new TicketRangoFechasInvalidoError();
    }

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
