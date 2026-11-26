import { Inject, Injectable } from '@nestjs/common';
import {
  ClienteDesinstalacionNoEncontradaError,
  TecnicoDesinstalacionConflictoError,
} from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
  ClienteDesinstalacionTecnicoRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';

export type EliminarTecnicoDesinstalacionInput = {
  desinstalacionId: number;
  tecnicoOperacionId: number;
};

@Injectable()
export class EliminarTecnicoDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicos: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(input: EliminarTecnicoDesinstalacionInput): Promise<void> {
    const desinstalacion = await this.desinstalaciones.findById(
      input.desinstalacionId,
    );

    if (!desinstalacion) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    if (desinstalacion.isFinalizada) {
      throw new TecnicoDesinstalacionConflictoError(
        'No se pueden eliminar técnicos de una desinstalación finalizada.',
      );
    }

    await this.tecnicos.deleteById(input);
  }
}
