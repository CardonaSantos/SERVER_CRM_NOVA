import { Inject, Injectable } from '@nestjs/common';
import { CancelarClienteDesinstalacionDto } from '../dto/cancelar-cliente-desinstalacion.dto';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionPrismaMapper } from '../../infra/prisma/cliente-desinstalacion.prisma.mapper';

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

  async execute(command: CancelarClienteDesinstalacionCommand) {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    desinstalacion.cancelar({
      fechaCancelacion: command.fechaCancelacion
        ? dayjs(command.fechaCancelacion).toDate()
        : null,
      motivo: command.motivo ?? null,
      observaciones: command.observaciones ?? null,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
