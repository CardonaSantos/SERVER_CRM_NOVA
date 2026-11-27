import { Inject, Injectable } from '@nestjs/common';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import { PlantillaContratoNoEncontradaError } from '../../domain/errors/contrato-cliente.errors';
import {
  PLANTILLA_CONTRATO_REPOSITORY,
  PlantillaContratoRepositoryPort,
} from '../../domain/ports/plantilla-contrato-repository.port';

@Injectable()
export class ObtenerPlantillaContratoUseCase {
  constructor(
    @Inject(PLANTILLA_CONTRATO_REPOSITORY)
    private readonly plantillas: PlantillaContratoRepositoryPort,
  ) {}

  async execute(input: {
    plantillaId: number;
  }): Promise<PlantillaContratoEntity> {
    const plantilla = await this.plantillas.findById(input.plantillaId);
    if (!plantilla) throw new PlantillaContratoNoEncontradaError();

    return plantilla;
  }
}
