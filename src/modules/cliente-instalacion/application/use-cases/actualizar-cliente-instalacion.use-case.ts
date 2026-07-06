import { Inject, Injectable } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { ActualizarClienteInstalacionDto } from '../dto/actualizar-cliente-instalacion.dto';

export type ActualizarClienteInstalacionCommand =
  ActualizarClienteInstalacionDto & {
    id: number;
    empresaId: number;
  };

@Injectable()
export class ActualizarClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: ActualizarClienteInstalacionCommand,
  ): Promise<ClienteInstalacionEntity> {
    const instalacion = await this.instalacionRepository.findById({
      id: command.id,
    });

    if (!instalacion) {
      throw new Error('Instalacion no encontrada');
    }

    instalacion.actualizarDatosGenerales({
      asesorId: command.asesorId,
      servicioInternetId: command.servicioInternetId,
      ticketId: command.ticketId,

      fechaProgramada:
        command.fechaProgramada !== undefined
          ? command.fechaProgramada
            ? new Date(command.fechaProgramada)
            : null
          : undefined,

      direccionInstalacion: command.direccionInstalacion,
      referenciaUbicacion: command.referenciaUbicacion,

      latitud: command.latitud,
      longitud: command.longitud,

      observaciones: command.observaciones,
    });

    return this.instalacionRepository.save(instalacion);
  }
}
