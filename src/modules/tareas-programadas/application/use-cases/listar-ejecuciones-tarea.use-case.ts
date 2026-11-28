import { Inject, Injectable } from '@nestjs/common';

import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { estaAbandonada } from '../../domain/policies/situacion-visible.policy';
import {
  EJECUCION_TAREA_QUERY,
  EjecucionTareaQueryPort,
} from '../../domain/ports/ejecucion-tarea-query.port';
import {
  EjecucionTareaFiltros,
  EjecucionTareaVista,
} from '../../domain/read-models/ejecucion-tarea-listado.read-model';

export type ListarEjecucionesTareaInput = EjecucionTareaFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarEjecucionesTareaUseCase {
  constructor(
    @Inject(EJECUCION_TAREA_QUERY)
    private readonly consulta: EjecucionTareaQueryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ListarEjecucionesTareaInput,
  ): Promise<ResultadoPaginado<EjecucionTareaVista>> {
    const { page, limit, ...filtros } = input;
    const resultado = await this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
    const ahora = this.reloj.ahora();

    return {
      ...resultado,
      items: resultado.items.map((item) => ({
        ...item,
        abandonada: estaAbandonada(item, ahora),
      })),
    };
  }
}
