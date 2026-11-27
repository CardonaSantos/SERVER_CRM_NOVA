import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  CATALOGO_TICKET_QUERY,
  CatalogoTicketQueryPort,
} from '../../domain/ports/catalogo-ticket-query.port';
import {
  CatalogoTicketFiltros,
  EtiquetaTicketListItem,
} from '../../domain/read-models/catalogo-ticket.read-model';

@Injectable()
export class ListarEtiquetasTicketUseCase {
  constructor(
    @Inject(CATALOGO_TICKET_QUERY)
    private readonly consulta: CatalogoTicketQueryPort,
  ) {}

  execute(
    input: CatalogoTicketFiltros & { page?: number; limit?: number },
  ): Promise<ResultadoPaginado<EtiquetaTicketListItem>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findEtiquetas(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
