import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ReprogramarClienteDesinstalacionDto } from '../dto/reprogramar-cliente-desinstalacion.dto';

export type ReprogramarClienteDesinstalacionCommand =
  ReprogramarClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class ReprogramarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ReprogramarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    desinstalacion.reprogramar({
      fechaProgramada: dayjs(command.fechaProgramada).toDate(),
      motivo: command.motivo ?? null,
      observaciones: command.observaciones ?? null,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
