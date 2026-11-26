import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  CLIENTE_LISTADO_QUERY,
  ClienteListadoQueryPort,
} from '../../domain/ports/cliente-listado-query.port';
import {
  ClienteRutaFiltros,
  ClienteRutaItem,
} from '../../domain/read-models/cliente-listado.read-model';

export type ListarClientesRutaInput = Omit<
  ClienteRutaFiltros,
  'sortBy' | 'sortDir'
> &
  Partial<Pick<ClienteRutaFiltros, 'sortBy' | 'sortDir'>> & {
    page?: number;
    limit?: number;
  };

/** Clientes para armar una ruta de cobro, ordenables por lo que deben. */
@Injectable()
export class ListarClientesRutaUseCase {
  constructor(
    @Inject(CLIENTE_LISTADO_QUERY)
    private readonly consulta: ClienteListadoQueryPort,
  ) {}

  execute(
    input: ListarClientesRutaInput,
  ): Promise<ResultadoPaginado<ClienteRutaItem>> {
    const { page, limit, sortBy, sortDir, ...filtros } = input;

    return this.consulta.findParaRuta(
      { ...filtros, sortBy: sortBy ?? 'nombre', sortDir: sortDir ?? 'asc' },
      normalizarPaginacion({ page, limit }),
    );
  }
}
