import { Inject, Injectable } from '@nestjs/common';
import {
  DireccionOrden,
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  PLANTILLA_CONTRATO_QUERY,
  PlantillaContratoQueryPort,
} from '../../domain/ports/plantilla-contrato-query.port';
import {
  OrdenPlantillaContrato,
  PlantillaContratoListItem,
} from '../../domain/read-models/plantilla-contrato-listado.read-model';

export type ListarPlantillasContratoInput = {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: OrdenPlantillaContrato;
  sortDir?: DireccionOrden;
};

@Injectable()
export class ListarPlantillasContratoUseCase {
  constructor(
    @Inject(PLANTILLA_CONTRATO_QUERY)
    private readonly plantillas: PlantillaContratoQueryPort,
  ) {}

  execute(
    input: ListarPlantillasContratoInput,
  ): Promise<ResultadoPaginado<PlantillaContratoListItem>> {
    return this.plantillas.findMany({
      ...normalizarPaginacion(input),
      search: input.search,
      sortBy: input.sortBy ?? OrdenPlantillaContrato.NOMBRE,
      sortDir: input.sortDir ?? 'asc',
    });
  }
}
