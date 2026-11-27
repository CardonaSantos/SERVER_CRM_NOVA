import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import { PlantillaContratoNoEncontradaError } from '../../domain/errors/contrato-cliente.errors';
import {
  PLANTILLA_CONTRATO_REPOSITORY,
  PlantillaContratoRepositoryPort,
} from '../../domain/ports/plantilla-contrato-repository.port';

export type EditarPlantillaContratoInput = {
  plantillaId: number;
  nombre?: string;
  body?: string;
};

@Injectable()
export class EditarPlantillaContratoUseCase {
  constructor(
    @Inject(PLANTILLA_CONTRATO_REPOSITORY)
    private readonly plantillas: PlantillaContratoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: EditarPlantillaContratoInput,
  ): Promise<PlantillaContratoEntity> {
    const plantilla = await this.plantillas.findById(input.plantillaId);
    if (!plantilla) throw new PlantillaContratoNoEncontradaError();

    plantilla.actualizar(
      { nombre: input.nombre, body: input.body },
      this.reloj.ahora(),
    );

    return this.plantillas.update(plantilla);
  }
}
