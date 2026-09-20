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

import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';

import { ValidarAutorizacionDesinstalacionService } from '../services/validar-autorizacion-desinstalacion.service';

export type IniciarClienteDesinstalacionCommand =
  IniciarClienteDesinstalacionDto & {
    id: number;

    ejecutadoPorId: number;
  };

@Injectable()
export class IniciarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    private readonly validarAutorizacionDesinstalacionService: ValidarAutorizacionDesinstalacionService,
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

    if (!desinstalacion.isProgramada) {
      throw new ConflictException(
        `La desinstalación no puede iniciarse desde el estado ${desinstalacion.estado}.`,
      );
    }

    /**
     * El trabajo físico solamente puede comenzar
     * después de haber sido autorizado.
     *
     * La eliminación PPPoE ya ocurrió durante
     * la aprobación administrativa.
     */
    await this.validarAutorizacionDesinstalacionService.exigirAprobada(
      command.id,
    );

    desinstalacion.iniciar({
      ejecutadoPorId: command.ejecutadoPorId,

      fechaInicio: command.fechaInicio
        ? dayjs(command.fechaInicio).toDate()
        : undefined,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
