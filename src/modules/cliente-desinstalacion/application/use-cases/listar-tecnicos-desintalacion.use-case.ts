import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico.repository.port';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';

@Injectable()
export class ListarTecnicosDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly desinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicoRepository: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(
    desinstalacionId: number,
  ): Promise<ClienteDesinstalacionTecnicoEntity[]> {
    const desinstalacion =
      await this.desinstalacionRepository.findById(desinstalacionId);

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    return this.tecnicoRepository.findByDesinstalacionId(desinstalacionId);
  }
}
