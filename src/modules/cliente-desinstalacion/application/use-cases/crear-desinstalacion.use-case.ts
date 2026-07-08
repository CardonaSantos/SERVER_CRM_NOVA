import { Inject, Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/value-objects/money.vo';
import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CrearClienteDesinstalacionDto } from '../dto/create-desinstalacion-cliente.dto';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { dayjs } from 'src/Utils/dayjs.config';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';

export type CrearClienteDesInstalacionCommand =
  CrearClienteDesinstalacionDto & {
    creadoPorId: number;
  };

@Injectable()
export class CrearDesinstalacionUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    command: CrearClienteDesInstalacionCommand,
  ): Promise<ClienteDesinstalacionEntity> {
    const desinstalacion = ClienteDesinstalacionEntity.create({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,
      ticketId: command.ticketId ?? null,

      solicitadoPorId: command.solicitadoPorId ?? command.creadoPorId ?? null,
      ejecutadoPorId: command.ejecutadoPorId ?? null,
      creadoPorId: command.creadoPorId ?? null,

      tipo: command.tipo ?? TipoDesinstalacionCliente.COMPLETA,
      motivo: command.motivo ?? null,

      fechaProgramada: command.fechaProgramada
        ? dayjs(command.fechaProgramada).toDate()
        : null,

      fechaSolicitud: command.fechaSolicitud
        ? dayjs(command.fechaSolicitud).toDate()
        : null,

      requiereRetiroEquipo: command.requiereRetiroEquipo ?? true,

      saldoClienteAlMomento:
        command.saldoClienteAlMomento !== undefined &&
        command.saldoClienteAlMomento !== null
          ? Money.fromNumber(command.saldoClienteAlMomento)
          : Money.zero(),

      direccionServicio: command.direccionServicio ?? null,
      referenciaUbicacion: command.referenciaUbicacion ?? null,
      latitud: command.latitud ?? null,
      longitud: command.longitud ?? null,

      observaciones: command.observaciones ?? null,
    });

    return this.clienteDesinstalacionRepository.create(desinstalacion);
  }
}
