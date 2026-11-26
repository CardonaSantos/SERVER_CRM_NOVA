import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  TICKET_SOPORTE_HISTORIAL_QUERY,
  TicketSoporteHistorialQueryPort,
} from '../../domain/ports/ticket-soporte-historial-query.port';
import {
  TicketSoporteHistorialFiltros,
  TicketSoporteHistorialResumen,
} from '../../domain/read-models/ticket-soporte-historial.read-model';

export const LIMITE_HISTORIAL_POR_DEFECTO = 20;

export type ListarTicketSoporteHistorialInput =
  TicketSoporteHistorialFiltros & {
    page?: number;
    limit?: number;
  };

@Injectable()
export class ListarTicketSoporteHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_QUERY)
    private readonly consulta: TicketSoporteHistorialQueryPort,
  ) {}

  execute(
    input: ListarTicketSoporteHistorialInput,
  ): Promise<ResultadoPaginado<TicketSoporteHistorialResumen>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion(
        { page, limit },
        { limitePorDefecto: LIMITE_HISTORIAL_POR_DEFECTO },
      ),
    );
  }
}
