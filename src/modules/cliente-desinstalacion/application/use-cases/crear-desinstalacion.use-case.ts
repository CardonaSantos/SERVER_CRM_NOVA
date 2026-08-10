import { ConflictException, Inject, Injectable } from '@nestjs/common';

import { dayjs } from 'src/Utils/dayjs.config';
import { Money } from 'src/shared/domain/value-objects/money.vo';

import {
  CLIENTE_DESINSTALACION_CONTEXTO_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
} from '../../infra/tokens/cliente-desinstalacion.token';

import { ClienteDesInstalacionRepositoryPort } from '../../domain/ports/cliente-desinstalacion.repository.port';

import { ClienteDesinstalacionTecnicoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-tecnico.repository.port';

import { ClienteDesinstalacionContextoRepositoryPort } from '../../domain/ports/cliente-desinstalacion-contexto.repository.port';

import { ClienteDesinstalacionEntity } from '../../domain/entities/cliente-desinstalacion.entitie';

import { ClienteDesinstalacionTecnicoEntity } from '../../domain/entities/cliente-desinstalacion-tecnico.entity';

import { CrearClienteDesinstalacionDto } from '../dto/create-desinstalacion-cliente.dto';

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
    @Inject(CLIENTE_DESINSTALACION_CONTEXTO_REPOSITORY)
    private readonly contextoRepository: ClienteDesinstalacionContextoRepositoryPort,

    private readonly validarAccesoDesinstalacionService: ValidarAccesoDesinstalacionService,

    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,

    @Inject(CLIENTE_DESINSTALACION_TECNICO_REPOSITORY)
    private readonly tecnicoRepository: ClienteDesinstalacionTecnicoRepositoryPort,
  ) {}

  async execute(
    command: CrearClienteDesInstalacionCommand,
  ): Promise<CrearClienteDesinstalacionResult> {
    this.validarTecnicoResponsable(command);

    /**
     * El frontend únicamente indica:
     *
     * clienteId + accesoInternetId
     *
     * La empresa y el servicio asociados al acceso son datos
     * canónicos del backend y no deben confiarse al cliente HTTP.
     */
    const acceso = await this.validarAccesoDesinstalacionService.validar({
      clienteId: command.clienteId,

      accesoInternetId: command.accesoInternetId,
    });

    const empresaId = acceso.empresaId;

    const servicioInternetId = acceso.servicioInternetId;

    /**
     * Aunque ValidarAccesoDesinstalacionService también protege esta
     * condición, aquí necesitamos estrechar el tipo a number para crear
     * correctamente la desinstalación.
     */
    if (servicioInternetId === null) {
      throw new ConflictException(
        'El acceso seleccionado no tiene un servicio de internet asociado.',
      );
    }

    await this.validarTicket(command.ticketId, command.clienteId);

    const desinstalacion = ClienteDesinstalacionEntity.create({
      /**
       * Relaciones principales.
       */
      empresaId,

      clienteId: command.clienteId,

      servicioInternetId,

      accesoInternetId: command.accesoInternetId,

      ticketId: command.ticketId ?? null,

      /**
       * Auditoría.
       *
       * Al crear la solicitud, quien la registra también queda como
       * solicitante. El ejecutor se conocerá únicamente al iniciar.
       */
      solicitadoPorId: command.creadoPorId,

      creadoPorId: command.creadoPorId,

      ejecutadoPorId: null,

      /**
       * Datos administrativos.
       */
      tipo: command.tipo,

      motivo: command.motivo,

      fechaSolicitud: new Date(),

      fechaProgramada: dayjs(command.fechaProgramada).toDate(),

      requiereRetiroEquipo: command.requiereRetiroEquipo ?? true,

      observaciones: command.observaciones ?? null,

      /**
       * No se capturan nuevamente desde el formulario.
       *
       * La ubicación pertenece al servicio/instalación existente.
       */
      direccionServicio: null,

      referenciaUbicacion: null,

      latitud: null,

      longitud: null,

      /**
       * No confiamos en un saldo proporcionado por el frontend.
       *
       * Si posteriormente necesitamos un snapshot financiero real,
       * deberá calcularse desde el backend.
       */
      saldoClienteAlMomento: Money.zero(),
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

  private validarTecnicoResponsable(
    command: CrearClienteDesInstalacionCommand,
  ): void {
    const responsableCount =
      command.tecnicos?.filter((tecnico) => tecnico.esResponsable).length ?? 0;

    if (responsableCount > 1) {
      throw new ConflictException(
        'Solo puede haber un técnico responsable por desinstalación.',
      );
    }
  }

  private async validarTicket(
    ticketId: number | null | undefined,
    clienteId: number,
  ): Promise<void> {
    if (ticketId === undefined || ticketId === null) {
      return;
    }

    const perteneceAlCliente =
      await this.contextoRepository.existsTicketForClient(ticketId, clienteId);

    if (!perteneceAlCliente) {
      throw new ConflictException(
        `El ticket ${ticketId} no pertenece al cliente ${clienteId}.`,
      );
    }
  }
}
