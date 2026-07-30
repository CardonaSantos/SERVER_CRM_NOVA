import {
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { dayjs } from 'src/Utils/dayjs.config';

import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';

import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';

import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

import { MarcarFallidaClienteDesinstalacionDto } from '../dto/marcar-fallida-cliente-desinstalacion.dto';

export type MarcarFallidaClienteDesinstalacionCommand =
  MarcarFallidaClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class MarcarFallidaClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: MarcarFallidaClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    try {
      desinstalacion.marcarFallida({
        motivo: command.motivo ?? null,

        resultado: command.resultado ?? null,

        observaciones: command.observaciones ?? null,

        fechaFinalizacion: command.fechaFinalizacion
          ? dayjs(command.fechaFinalizacion).toDate()
          : undefined,
      });
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'No se pudo marcar la desinstalación como fallida.',
      );
    }

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
