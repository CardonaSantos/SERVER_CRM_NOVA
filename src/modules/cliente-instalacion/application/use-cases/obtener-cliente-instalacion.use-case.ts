import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ClienteInstalacionDetalle, ClienteInstalacionRepositoryPort, CLIENTE_INSTALACION_REPOSITORY } from '../../domain/ports/cliente-instalacion-repository.port';

export type ObtenerClienteInstalacionCommand = {
  id: number;
};

@Injectable()
export class ObtenerClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ObtenerClienteInstalacionCommand,
  ): Promise<ClienteInstalacionDetalle> {
    const detalle = await this.instalacionRepository.findDetailById({
      id: command.id,
    });

    if (!detalle) {
      throw new NotFoundException('Instalación no encontrada.');
    }

    return detalle;
  }
}
