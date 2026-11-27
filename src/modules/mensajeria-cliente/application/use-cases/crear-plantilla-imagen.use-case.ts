import { Injectable } from '@nestjs/common';
import { CategoriaPlantilla } from '../../domain/enums/plantilla.enum';
import { componentesDePlantillaConImagen } from '../../domain/policies/plantilla.policy';
import { PlantillaCreada } from '../ports/proveedor-plantillas.port';
import { CrearPlantillaUseCase } from './crear-plantilla.use-case';

export type CrearPlantillaImagenInput = {
  name: string;
  language: string;
  headerHandle?: string;
  bodyText: string;
  bodyExample: string[][];
  footerText?: string;
};

/** Plantilla de servicio (UTILITY) con imagen opcional en el encabezado. */
@Injectable()
export class CrearPlantillaImagenUseCase {
  constructor(private readonly crear: CrearPlantillaUseCase) {}

  execute(input: CrearPlantillaImagenInput): Promise<PlantillaCreada> {
    return this.crear.execute({
      name: input.name,
      language: input.language,
      category: CategoriaPlantilla.UTILITY,
      components: componentesDePlantillaConImagen(input),
    });
  }
}
