import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';

import { PerfilHomologacionRepositoryPort } from '../../domain/ports/ppoe-perfil-homologacion.port';

import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from '../../infra/tokens/ppoe-perfil-homologacion.token';

export type ObtenerPerfilHomologacionCommand = {
  id: number;
};

@Injectable()
export class ObtenerPerfilHomologacionUseCase {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
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
