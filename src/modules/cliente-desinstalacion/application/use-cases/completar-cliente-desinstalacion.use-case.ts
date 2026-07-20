import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { CompletarClienteDesinstalacionDto } from '../dto/completar-cliente-desinstalacion.dto';

export type CompletarClienteDesinstalacionCommand =
  CompletarClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class CompletarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: CompletarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    desinstalacion.completar({
      ejecutadoPorId: command.ejecutadoPorId,
      resultado: command.resultado ?? null,
      observaciones: command.observaciones ?? null,
      fechaFinalizacion: command.fechaFinalizacion
        ? dayjs(command.fechaFinalizacion).toDate()
        : undefined,
      equipoRecuperado: command.equipoRecuperado ?? false,
      conforme: command.conforme ?? null,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
