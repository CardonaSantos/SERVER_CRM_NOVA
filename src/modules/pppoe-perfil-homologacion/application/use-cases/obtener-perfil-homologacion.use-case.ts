import { Inject, Injectable } from '@nestjs/common';

import { PerfilHomologacionNoEncontradoError } from '../../domain/errors/pppoe-perfil-homologacion.errors';
import {
  PERFIL_HOMOLOGACION_REPOSITORY,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import {
  PerfilHomologacionReadModel,
  aPerfilHomologacionReadModel,
} from '../../domain/read-models/perfil-homologacion.read-model';

export type ObtenerPerfilHomologacionInput = { id: number };

@Injectable()
export class ObtenerPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfiles: PerfilHomologacionRepositoryPort,
  ) {}

  async execute(
    input: ObtenerPerfilHomologacionInput,
  ): Promise<PerfilHomologacionReadModel> {
    const perfil = await this.perfiles.findById(input.id);
    if (!perfil) throw new PerfilHomologacionNoEncontradoError();

    return aPerfilHomologacionReadModel(perfil);
  }
}
