import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { Money } from 'src/shared/domain/value-objects/money.vo';
import {
  CLIENTE_DESINSTALACION_REPOSITORY,
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';
import { CrearClienteDesinstalacionDto } from '../dto/create-desinstalacion-cliente.dto';
import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';
import { dayjs } from 'src/Utils/dayjs.config';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico.repository.port';
import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';
import { ValidarAccesoDesinstalacionService } from '../services/validar-acceso-desinstalacion.service';

export type CrearClienteDesInstalacionCommand =
  CrearClienteDesinstalacionDto & {
    creadoPorId: number;
  };

export type CrearClienteDesinstalacionResult = {
  desinstalacion: ClienteDesinstalacionEntity;
  tecnicos: ClienteDesinstalacionTecnicoEntity[];
};

@Injectable()
export class CrearDesinstalacionUseCase {
  constructor(
    private readonly validarAccesoDesinstalacionService: ValidarAccesoDesinstalacionService,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicoRepository: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(
    command: CrearClienteDesInstalacionCommand,
  ): Promise<CrearClienteDesinstalacionResult> {
    const responsableCount =
      command.tecnicos?.filter((tecnico) => tecnico.esResponsable).length ?? 0;

    if (responsableCount > 1) {
      throw new ConflictException(
        'Solo puede haber un técnico responsable por desinstalación.',
      );
    }

    if (command.accesoInternetId !== undefined) {
      await this.validarAccesoDesinstalacionService.validar({
        empresaId: command.empresaId,
        clienteId: command.clienteId,
        servicioInternetId: command.servicioInternetId ?? null,
        accesoInternetId: command.accesoInternetId,
      });
    }

    const desinstalacion = ClienteDesinstalacionEntity.create({
      clienteId: command.clienteId,
      empresaId: command.empresaId,

      servicioInternetId: command.servicioInternetId ?? null,

      ticketId: command.ticketId ?? null,
      accesoInternetId: command.accesoInternetId ?? null,
      solicitadoPorId: command.solicitadoPorId ?? command.creadoPorId ?? null,
      creadoPorId: command.creadoPorId ?? null,
      ejecutadoPorId: command.ejecutadoPorId ?? null,

      direccionServicio: command.direccionServicio ?? null,
      referenciaUbicacion: command.referenciaUbicacion ?? null,

      fechaProgramada: command.fechaProgramada
        ? dayjs(command.fechaProgramada).toDate()
        : null,

      fechaSolicitud: command.fechaSolicitud
        ? dayjs(command.fechaSolicitud).toDate()
        : null,

      latitud: command.latitud ?? null,
      longitud: command.longitud ?? null,

      motivo: command.motivo ?? null,
      observaciones: command.observaciones ?? null,

      tipo: command.tipo ?? TipoDesinstalacionCliente.COMPLETA,

      requiereRetiroEquipo: command.requiereRetiroEquipo ?? true,

      saldoClienteAlMomento:
        command.saldoClienteAlMomento !== undefined &&
        command.saldoClienteAlMomento !== null
          ? Money.fromNumber(command.saldoClienteAlMomento)
          : Money.zero(),
    });

    const savedDesinstalacion =
      await this.clienteDesinstalacionRepository.create(desinstalacion);

    const savedProps = savedDesinstalacion.toPrimitives();

    let savedTecnicos: ClienteDesinstalacionTecnicoEntity[] = [];

    if (command.tecnicos?.length) {
      const tecnicos = command.tecnicos.map((tecnico) =>
        ClienteDesinstalacionTecnicoEntity.create({
          desinstalacionId: savedProps.id!,
          tecnicoId: tecnico.tecnicoId ?? null,
          rol: tecnico.rol,
          esResponsable: tecnico.esResponsable ?? false,
          tiempoMinutos: tecnico.tiempoMinutos ?? null,
          observaciones: tecnico.observaciones ?? null,
          tecnicoNombreSnapshot: tecnico.tecnicoNombreSnapshot ?? null,
        }),
      );

      savedTecnicos = await this.tecnicoRepository.createMany(tecnicos);
    }

    return {
      desinstalacion: savedDesinstalacion,
      tecnicos: savedTecnicos,
    };
  }
}
