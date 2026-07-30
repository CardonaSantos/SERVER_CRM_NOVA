import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ActualizarClienteDesinstalacionDto } from '../dto/actualizar-desinstalacion-cliente.dto';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { dayjs } from 'src/Utils/dayjs.config';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';

export type ActualizarClienteDesinstalacionCommand =
  ActualizarClienteDesinstalacionDto & {
    id: number;
  };

@Injectable()
export class ActualizarClienteDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ActualizarClienteDesinstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = await this.clienteDesinstalacionRepository.findById(
      command.id,
    );

    if (!desinstalacion) {
      throw new NotFoundException('Desinstalación no encontrada.');
    }

    desinstalacion.actualizarDatosGenerales({
      servicioInternetId: command.servicioInternetId,
      ticketId: command.ticketId,

      accesoInternetId: command.accesoInternetId,

      solicitadoPorId: command.solicitadoPorId,
      ejecutadoPorId: command.ejecutadoPorId,

      tipo: command.tipo,
      motivo: command.motivo,

      fechaProgramada:
        command.fechaProgramada !== undefined
          ? command.fechaProgramada
            ? dayjs(command.fechaProgramada).toDate()
            : null
          : undefined,

      requiereRetiroEquipo: command.requiereRetiroEquipo,

      direccionServicio: command.direccionServicio,
      referenciaUbicacion: command.referenciaUbicacion,
      latitud: command.latitud,
      longitud: command.longitud,

      observaciones: command.observaciones,
    });

    return this.clienteDesinstalacionRepository.save(desinstalacion);
  }
}
