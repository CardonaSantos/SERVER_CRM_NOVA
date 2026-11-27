import { Inject, Injectable, Logger } from '@nestjs/common';
import { PlantillaContratoNoEncontradaError } from '../../domain/errors/contrato-cliente.errors';
import {
  PLANTILLA_CONTRATO_REPOSITORY,
  PlantillaContratoRepositoryPort,
} from '../../domain/ports/plantilla-contrato-repository.port';

@Injectable()
export class EliminarPlantillaContratoUseCase {
  private readonly logger = new Logger(EliminarPlantillaContratoUseCase.name);

  constructor(
    @Inject(PLANTILLA_CONTRATO_REPOSITORY)
    private readonly plantillas: PlantillaContratoRepositoryPort,
  ) {}

  async execute(input: {
    plantillaId: number;
    usuarioId: number;
  }): Promise<void> {
    if (!(await this.plantillas.delete(input.plantillaId))) {
      throw new PlantillaContratoNoEncontradaError();
    }

    this.logger.log(
      `Plantilla ${input.plantillaId} eliminada por el usuario ${input.usuarioId}.`,
    );
  }
}
