import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  SECTOR_QUERY,
  SectorQueryPort,
} from '../../domain/ports/sector-query.port';
import {
  SectorFiltros,
  SectorListItem,
} from '../../domain/read-models/sector-listado.read-model';

export type ListarSectoresInput = SectorFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarSectoresUseCase {
  constructor(
    @Inject(SECTOR_QUERY) private readonly consulta: SectorQueryPort,
  ) {}

  execute(
    input: ListarSectoresInput,
  ): Promise<ResultadoPaginado<SectorListItem>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
