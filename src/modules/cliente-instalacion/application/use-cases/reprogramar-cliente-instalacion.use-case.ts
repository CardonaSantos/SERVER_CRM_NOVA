import { Inject, Injectable } from '@nestjs/common';
import { ReprogramarClienteInstalacionDto } from '../dto/reprogramar-cliente-instalacion.dto';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';

export type ReprogramarClienteInstalacionCommand =
  ReprogramarClienteInstalacionDto & {
    id: number;
  };

@Injectable()
export class ReprogramarInstalacionClienteUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(command: ReprogramarClienteInstalacionCommand) {
    const instalacion = await this.instalacionRepository.findById({
      id: command.id,
    });

    instalacion.reprogramar({
      fechaProgramada: command.fechaProgramada,
      motivo: command.motivo,
    });

    return this.instalacionRepository.save(instalacion);
  }
}
