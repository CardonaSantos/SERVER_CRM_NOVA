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

import { CancelarClienteDesinstalacionDto } from '../dto/cancelar-cliente-desinstalacion.dto';

export type CancelarClienteDesinstalacionCommand =
  CancelarClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class CancelarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: CancelarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    try {
      desinstalacion.cancelar({
        fechaCancelacion: command.fechaCancelacion
          ? dayjs(command.fechaCancelacion).toDate()
          : undefined,

        motivo: command.motivo ?? null,

        observaciones: command.observaciones ?? null,
      });
    } catch (error) {
      throw new ConflictException(
        error instanceof Error
          ? error.message
          : 'No se pudo cancelar la desinstalación.',
      );
    }

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
