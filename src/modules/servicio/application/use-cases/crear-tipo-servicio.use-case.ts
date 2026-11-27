import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import {
  TIPO_SERVICIO_REPOSITORY,
  TipoServicioRepositoryPort,
} from '../../domain/ports/tipo-servicio-repository.port';
import { CrearTipoServicioProps } from '../../domain/props/tipo-servicio.props';

@Injectable()
export class CrearTipoServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  execute(input: CrearTipoServicioProps): Promise<TipoServicioEntity> {
    return this.tipos.create(
      TipoServicioEntity.create(input, this.reloj.ahora()),
    );
  }
}
