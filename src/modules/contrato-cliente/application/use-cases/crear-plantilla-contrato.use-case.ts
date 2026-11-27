import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { PlantillaContratoEntity } from '../../domain/entities/plantilla-contrato.entity';
import {
  PLANTILLA_CONTRATO_REPOSITORY,
  PlantillaContratoRepositoryPort,
} from '../../domain/ports/plantilla-contrato-repository.port';
import { CrearPlantillaContratoProps } from '../../domain/props/plantilla-contrato.props';

@Injectable()
export class CrearPlantillaContratoUseCase {
  constructor(
    @Inject(PLANTILLA_CONTRATO_REPOSITORY)
    private readonly plantillas: PlantillaContratoRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(
    input: CrearPlantillaContratoProps,
  ): Promise<PlantillaContratoEntity> {
    return this.plantillas.create(
      PlantillaContratoEntity.create(input, this.reloj.ahora()),
    );
  }
}
