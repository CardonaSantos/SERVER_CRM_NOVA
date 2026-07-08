import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

export type ObtenerClienteDesinstalacionCommand = {
  id: number;
};

@Injectable()
export class ObtenerClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ObtenerClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    return desinstalacion;
  }
}
