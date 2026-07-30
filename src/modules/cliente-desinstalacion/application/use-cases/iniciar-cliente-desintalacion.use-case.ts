import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { IniciarClienteDesinstalacionDto } from '../dto/iniciar-cliente-desinstalacion.dto';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

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
    private readonly validarAccesoDesinstalacionService: ValidarAccesoDesinstalacionService,
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

    await this.validarAutorizacionDesinstalacionService.exigirAprobada(
      command.id,
    );

    const props = desinstalacion.toPrimitives();

    if (
      props.accesoInternetId !== null &&
      props.accesoInternetId !== undefined
    ) {
      await this.validarAccesoDesinstalacionService.validar({
        empresaId: props.empresaId,
        clienteId: props.clienteId,
        servicioInternetId: props.servicioInternetId ?? null,
        accesoInternetId: props.accesoInternetId,
      });
    }

    desinstalacion.iniciar({
      ejecutadoPorId: command.ejecutadoPorId,

      fechaInicio: command.fechaInicio
        ? dayjs(command.fechaInicio).toDate()
        : undefined,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
