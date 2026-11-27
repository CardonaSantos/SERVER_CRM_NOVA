import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  PLAN_INTERNET_QUERY,
  PlanInternetQueryPort,
} from '../../domain/ports/plan-internet-query.port';
import {
  PlanInternetFiltros,
  PlanInternetListItem,
} from '../../domain/read-models/plan-internet-listado.read-model';

export type ListarPlanesInternetInput = PlanInternetFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarPlanesInternetUseCase {
  constructor(
    @Inject(PLAN_INTERNET_QUERY)
    private readonly consulta: PlanInternetQueryPort,
  ) {}

  execute(
    input: ListarPlanesInternetInput,
  ): Promise<ResultadoPaginado<PlanInternetListItem>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
