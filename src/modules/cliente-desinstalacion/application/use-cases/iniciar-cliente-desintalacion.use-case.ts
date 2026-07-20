import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';

export type IniciarClienteDesinstalacionCommand =
  IniciarClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class IniciarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: IniciarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    desinstalacion.iniciar({
      fechaInicio: command.fechaInicio
        ? dayjs(command.fechaInicio).toDate()
        : undefined,
      ejecutadoPorId: command.ejecutadoPorId ?? null,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
