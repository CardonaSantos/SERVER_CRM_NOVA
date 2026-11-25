import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PerfilHomologacionEntity } from '../../domain/entities/perfil-homologacion.entity';

import {
  PerfilHomologacionRepositoryPort,
  PERFIL_HOMOLOGACION_REPOSITORY,
} from '../../domain/ports/perfil-homologacion-repository.port';

export type ObtenerPerfilHomologacionCommand = {
  id: number;
};

@Injectable()
export class ObtenerPerfilHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  async execute({
    id,
  }: ObtenerPerfilHomologacionCommand): Promise<PerfilHomologacionEntity> {
    const perfil = await this.perfilRepository.findById(id);

    if (!perfil) {
      throw new NotFoundException(
        `No existe una homologación PPPoE con id ${id}.`,
      );
    }

    return perfil;
  }
}
