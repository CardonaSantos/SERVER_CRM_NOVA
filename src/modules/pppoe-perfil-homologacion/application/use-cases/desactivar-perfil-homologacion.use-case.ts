import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import { PerfilHomologacionEntity } from '../../domain/entities/ppoe-perfil-homologacion.entity';

import { PerfilHomologacionRepositoryPort } from '../../domain/ports/ppoe-perfil-homologacion.port';

import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from '../../infra/tokens/ppoe-perfil-homologacion.token';
import { CambiarEstadoPpoePerfilHomologacionDto } from '../dto/cambiar-estado-ppoe-perfil-homologacion.dto';

export type DesactivarPerfilHomologacionCommand =
  CambiarEstadoPpoePerfilHomologacionDto & {
    id: number;
  };

@Injectable()
export class DesactivarPerfilHomologacionUseCase {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  async execute(
    command: DesactivarPerfilHomologacionCommand,
  ): Promise<PerfilHomologacionEntity> {
    const perfil = await this.perfilRepository.findById(command.id);

    if (!perfil) {
      throw new NotFoundException(
        `No existe una homologación PPPoE con id ${command.id}.`,
      );
    }

    if (!perfil.estaActiva) {
      return perfil;
    }

    perfil.desactivar(command.actualizadoPorId);

    return this.perfilRepository.update(perfil);
  }
}
