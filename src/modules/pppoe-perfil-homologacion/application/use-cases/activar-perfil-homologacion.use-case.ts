import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { PerfilHomologacionNoEncontradoError } from '../../domain/errors/pppoe-perfil-homologacion.errors';
import {
  PERFIL_HOMOLOGACION_REPOSITORY,
  PerfilHomologacionRepositoryPort,
} from '../../domain/ports/perfil-homologacion-repository.port';
import {
  PerfilHomologacionReadModel,
  aPerfilHomologacionReadModel,
} from '../../domain/read-models/perfil-homologacion.read-model';

export type ActivarPerfilHomologacionInput = {
  id: number;
  actualizadoPorId: number;
};

/** Habilita la homologación para prealtas nuevas. Si ya está activa, no escribe. */
@Injectable()
export class ActivarPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfiles: PerfilHomologacionRepositoryPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: ActivarPerfilHomologacionInput,
  ): Promise<PerfilHomologacionReadModel> {
    const perfil = await this.perfiles.findById(input.id);
    if (!perfil) throw new PerfilHomologacionNoEncontradoError();

    if (perfil.activo) return aPerfilHomologacionReadModel(perfil);

    perfil.activar(input.actualizadoPorId, this.reloj.ahora());

    return aPerfilHomologacionReadModel(await this.perfiles.update(perfil));
  }
}
