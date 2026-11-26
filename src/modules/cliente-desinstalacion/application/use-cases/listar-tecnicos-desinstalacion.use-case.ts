import { Inject, Injectable } from '@nestjs/common';
import { ClienteDesinstalacionNoEncontradaError } from '../../domain/errors/cliente-desinstalacion.errors';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  ClienteDesinstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-repository.port';
import {
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
  ClienteDesinstalacionTecnicoRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-tecnico-repository.port';
import {
  resumirTecnico,
  TecnicoDesinstalacionResumen,
} from '../../domain/read-models/cliente-desinstalacion-resumen.read-model';

@Injectable()
export class ListarTecnicosDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalaciones: ClienteDesinstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicos: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(
    desinstalacionId: number,
  ): Promise<TecnicoDesinstalacionResumen[]> {
    if (!(await this.desinstalaciones.findById(desinstalacionId))) {
      throw new ClienteDesinstalacionNoEncontradaError();
    }

    const lista = await this.tecnicos.findByDesinstalacionId(desinstalacionId);

    return lista.map(resumirTecnico);
  }
}
