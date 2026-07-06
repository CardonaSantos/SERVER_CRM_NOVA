import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

export type ObtenerClienteInstalacionCommand = {
  id: number;
  empresaId: number;
};

@Injectable()
export class ObtenerClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ObtenerClienteInstalacionCommand,
  ): Promise<ClienteInstalacionEntity> {
    const instalacion = await this.instalacionRepository.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new NotFoundException('Instalación no encontrada.');
    }

    return instalacion;
  }
}
