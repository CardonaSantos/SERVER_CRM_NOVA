import { Inject, Injectable, Logger } from '@nestjs/common';
import { asegurarNombrePlantilla } from '../../domain/policies/plantilla.policy';
import {
  PROVEEDOR_PLANTILLAS,
  ProveedorPlantillasPort,
} from '../ports/proveedor-plantillas.port';

@Injectable()
export class EliminarPlantillaUseCase {
  private readonly logger = new Logger(EliminarPlantillaUseCase.name);

  constructor(
    @Inject(PROVEEDOR_PLANTILLAS)
    private readonly proveedor: ProveedorPlantillasPort,
  ) {}

  async execute(input: {
    usuarioId: number;
    nombre: string;
  }): Promise<{ nombre: string }> {
    asegurarNombrePlantilla(input.nombre);
    await this.proveedor.eliminar(input.nombre);
    this.logger.log(
      `Plantilla ${input.nombre} eliminada por el usuario ${input.usuarioId}`,
    );
    return { nombre: input.nombre };
  }
}
