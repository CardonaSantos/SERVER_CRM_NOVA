import { Inject, Injectable, NotFoundException } from '@nestjs/common';

import {
  ClienteDesinstalacionDetalle,
  ClienteDesInstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion.repository.port';

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
  ): Promise<ClienteDesinstalacionDetalle> {
    const detalle = await this.clienteDesinstalacionRepository.findDetalleById(
      command.id,
    );

    if (!detalle) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    return detalle;
  }
}
