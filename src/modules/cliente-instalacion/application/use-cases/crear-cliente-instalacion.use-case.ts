import { Inject, Injectable } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import { ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion.repository.port';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

export type CrearClienteInstalacionCommand = CrearClienteInstalacionDto & {
  creadoPorId: number;
};

@Injectable()
export class CrearClienteInstalacionUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    command: CrearClienteInstalacionCommand,
  ): Promise<ClienteInstalacionEntity> {
    const instalacion = ClienteInstalacionEntity.create({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,
      ticketId: command.ticketId ?? null,
      asesorId: command.asesorId ?? null,
      creadoPorId: command.creadoPorId,

      tipo: command.tipo,

      fechaProgramada: command.fechaProgramada
        ? new Date(command.fechaProgramada)
        : null,

      direccionInstalacion: command.direccionInstalacion ?? null,
      referenciaUbicacion: command.referenciaUbicacion ?? null,
      latitud: command.latitud ?? null,
      longitud: command.longitud ?? null,

      observaciones: command.observaciones ?? null,
    });

    return this.instalacionRepository.create(instalacion);
  }
}
