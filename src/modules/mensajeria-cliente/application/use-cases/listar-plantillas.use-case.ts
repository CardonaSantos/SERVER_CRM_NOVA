import { Inject, Injectable } from '@nestjs/common';
import {
  PaginaPlantillas,
  PlantillaFiltros,
} from '../../domain/read-models/plantilla.read-model';
import {
  PROVEEDOR_PLANTILLAS,
  ProveedorPlantillasPort,
} from '../ports/proveedor-plantillas.port';

/** Plantillas tal como están en WhatsApp. */
@Injectable()
export class ListarPlantillasUseCase {
  constructor(
    @Inject(PROVEEDOR_PLANTILLAS)
    private readonly proveedor: ProveedorPlantillasPort,
  ) {}

  execute(filtros: PlantillaFiltros): Promise<PaginaPlantillas> {
    return this.proveedor.listar(filtros);
  }
}
