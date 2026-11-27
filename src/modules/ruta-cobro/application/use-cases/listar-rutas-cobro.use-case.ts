import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  RUTA_COBRO_QUERY,
  RutaCobroQueryPort,
} from '../../domain/ports/ruta-cobro-query.port';
import {
  RutaCobroFiltros,
  RutaCobroResumen,
} from '../../domain/read-models/ruta-cobro.read-model';

export type ListarRutasCobroInput = RutaCobroFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarRutasCobroUseCase {
  constructor(
    @Inject(RUTA_COBRO_QUERY) private readonly consulta: RutaCobroQueryPort,
  ) {}

  execute(
    input: ListarRutasCobroInput,
  ): Promise<ResultadoPaginado<RutaCobroResumen>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
