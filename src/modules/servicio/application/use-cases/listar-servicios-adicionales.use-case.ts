import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  SERVICIO_ADICIONAL_QUERY,
  ServicioAdicionalQueryPort,
} from '../../domain/ports/servicio-adicional-query.port';
import {
  ServicioAdicionalFiltros,
  ServicioAdicionalListItem,
} from '../../domain/read-models/servicio-adicional-listado.read-model';

export type ListarServiciosAdicionalesInput = ServicioAdicionalFiltros & {
  page?: number;
  limit?: number;
};

@Injectable()
export class ListarServiciosAdicionalesUseCase {
  constructor(
    @Inject(SERVICIO_ADICIONAL_QUERY)
    private readonly consulta: ServicioAdicionalQueryPort,
  ) {}

  execute(
    input: ListarServiciosAdicionalesInput,
  ): Promise<ResultadoPaginado<ServicioAdicionalListItem>> {
    const { page, limit, ...filtros } = input;

    return this.consulta.findMany(
      filtros,
      normalizarPaginacion({ page, limit }),
    );
  }
}
