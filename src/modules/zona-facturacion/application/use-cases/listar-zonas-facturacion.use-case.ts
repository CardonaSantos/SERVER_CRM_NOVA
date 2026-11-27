import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  ZONA_FACTURACION_QUERY,
  ZonaFacturacionQueryPort,
} from '../../domain/ports/zona-facturacion-query.port';
import {
  ZonaFacturacionFiltros,
  ZonaFacturacionListItem,
} from '../../domain/read-models/zona-facturacion-listado.read-model';

export type ListarZonasFacturacionInput = ZonaFacturacionFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarZonasFacturacionUseCase {
  constructor(
    @Inject(ZONA_FACTURACION_QUERY)
    private readonly consulta: ZonaFacturacionQueryPort,
  ) {}

  execute(
    input: ListarZonasFacturacionInput,
  ): Promise<ResultadoPaginado<ZonaFacturacionListItem>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
