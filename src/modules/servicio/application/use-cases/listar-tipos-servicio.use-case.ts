import { Inject, Injectable } from '@nestjs/common';
import { TipoServicioEntity } from '../../domain/entities/tipo-servicio.entity';
import {
  TIPO_SERVICIO_REPOSITORY,
  TipoServicioRepositoryPort,
} from '../../domain/ports/tipo-servicio-repository.port';

@Injectable()
export class ListarTiposServicioUseCase {
  constructor(
    @Inject(TIPO_SERVICIO_REPOSITORY)
    private readonly tipos: TipoServicioRepositoryPort,
  ) {}

  execute(): Promise<TipoServicioEntity[]> {
    return this.tipos.findAll();
  }
}
