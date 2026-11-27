import { Inject, Injectable } from '@nestjs/common';
import {
  asegurarNombrePlantilla,
  sanearComponentes,
} from '../../domain/policies/plantilla.policy';
import {
  NuevaPlantilla,
  PlantillaCreada,
  PROVEEDOR_PLANTILLAS,
  ProveedorPlantillasPort,
} from '../ports/proveedor-plantillas.port';

@Injectable()
export class CrearPlantillaUseCase {
  constructor(
    @Inject(PROVEEDOR_PLANTILLAS)
    private readonly proveedor: ProveedorPlantillasPort,
  ) {}

  async execute(input: NuevaPlantilla): Promise<PlantillaCreada> {
    asegurarNombrePlantilla(input.name);

    return this.proveedor.crear({
      ...input,
      components: sanearComponentes(input.components),
    });
  }
}
