import { HttpException, Inject, Injectable, Logger } from '@nestjs/common';
import { ClienteInstalacionEntity } from '../../domain/entities/cliente-instalacion.entity';
import {
  ClienteInstalacionRepositoryPort,
  CrearTecnicoInstalacionInput,
} from '../../domain/ports/cliente-instalacion.repository.port';
import { CrearClienteInstalacionDto } from '../dto/crear-cliente-instalacion.dto';
import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';
import { RolTecnicoOperacionCliente } from '../../domain/enums/rol-tecnico-operacion-cliente.enum';
import { CLIENTE_ACCESO_INTERNET_REPOSITORY } from 'src/modules/pppoe-acceso-internet/infra/tokens/token-ppoe-acceso-internet.token';
import { ClienteAccesoInternetRepositoryPort } from 'src/modules/pppoe-acceso-internet/domain/ports/ppoe-acceso-internet.port';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from 'src/modules/ppoe-instalacion-acceso/tokens/instalacion-acceso.token';
import { ClienteInstalacionAccesoRepositoryPort } from 'src/modules/ppoe-instalacion-acceso/domain/ports/cliente-instalacion-acceso.port';
import { ClienteAccesoInternetEntity } from 'src/modules/pppoe-acceso-internet/domain/entities/ppoe-acceso-internet.entity';
import {
  MetodoAutenticacionInternet,
  TecnologiaAccesoInternet,
} from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';
import { ClienteInstalacionAccesoEntity } from 'src/modules/ppoe-instalacion-acceso/domain/entities/ppoe-instalacion-acceso.entity';
import { AccionInstalacionAcceso } from 'src/modules/ppoe-instalacion-acceso/domain/enums/ppoe-instalacion-acceso.enum';

import {
  AccesoInstalacionInput,
  ModoAccesoInstalacion,
} from '../dto/iniciar-acceso-types.dto';
import {
  PPPOE_PREALTA,
  PppoePrealtaPort,
} from 'src/modules/pppoe-automatizacion/domain/ports/pppoe-prealta.port';

import {
  ClienteInstalacionAccesoResult,
  CrearClienteInstalacionResult,
  EstadoResultadoPrealtaPppoe,
  PrealtaPppoeInstalacionResult,
} from '../../results/crear-cliente-instalacion.result';

export type CrearClienteInstalacionCommand = CrearClienteInstalacionDto & {
  creadoPorId: number;
  acceso: AccesoInstalacionInput;
};

type ProcesarAccesoInstalacionParams = {
  instalacionId: number;
  command: CrearClienteInstalacionCommand;
};

type ProcesarProvisionamientoNuevoParams = {
  instalacionId: number;

  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;

  accesoInternetId: number;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;

  mikrotikRouterId: number | null;
  generadoPorId: number;
};

type ProvisionamientoGponPppoeParams = {
  instalacionId: number;

  empresaId: number;
  clienteId: number;
  servicioInternetId: number;

  accesoInternetId: number;
  mikrotikRouterId: number;

  generadoPorId: number;
};

type ProvisionamientoPendienteParams = {
  instalacionId: number;
  accesoInternetId: number;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
};

type CrearAccesoNuevoParams = {
  empresaId: number;
  clienteId: number;
  servicioInternetId: number | null;

  tecnologia: TecnologiaAccesoInternet;
  metodoAutenticacion: MetodoAutenticacionInternet;
};

type VincularAccesoExistenteParams = {
  instalacionId: number;
  clienteId: number;
  accesoInternetId: number;
};

type VincularInstalacionAccesoParams = {
  instalacionId: number;
  accesoInternetId: number;
  accion: AccionInstalacionAcceso;
};

type ProcesarAccesoInstalacionResult = {
  acceso: ClienteInstalacionAccesoResult;

  prealtaPppoe: PrealtaPppoeInstalacionResult;
};

@Injectable()
export class CrearClienteInstalacionUseCase {
  private readonly logger = new Logger(CrearClienteInstalacionUseCase.name);
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,

    // INYECCIONES
    @Inject(CLIENTE_ACCESO_INTERNET_REPOSITORY)
    private readonly accesoInternetRepository: ClienteAccesoInternetRepositoryPort,

    @Inject(CLIENTE_INSTALACION_ACCESO_REPOSITORY)
    private readonly instalacionAccesoRepository: ClienteInstalacionAccesoRepositoryPort,

    @Inject(PPPOE_PREALTA)
    private readonly pppoePrealta: PppoePrealtaPort,
  ) {}

  async execute(
    command: CrearClienteInstalacionCommand,
  ): Promise<CrearClienteInstalacionResult> {
    const tecnicos = this.normalizarTecnicos(command.tecnicos ?? []);

    const coordenadas = this.parseCoordenadas(command.coordenadas);

    const instalacion = ClienteInstalacionEntity.create({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,

      ticketId: command.ticketId ?? null,
      asesorId: command.asesorId ?? null,
      creadoPorId: command.creadoPorId,

      tipo: command.tipo,
      estado: command.estado,

      descripcion: command.descripcion ?? null,
      motivo: command.motivo ?? null,
      observaciones: command.observaciones ?? null,

      fechaProgramada: command.fechaProgramada
        ? new Date(command.fechaProgramada)
        : null,

      fechaInicio: command.fechaInicio ? new Date(command.fechaInicio) : null,

      direccionInstalacion: command.direccionInstalacion ?? null,

      referenciaUbicacion: command.referenciaUbicacion ?? null,

      latitud: coordenadas?.latitud ?? null,
      longitud: coordenadas?.longitud ?? null,

      costos: command.costos
        ? {
            costoInstalacion: command.costos.costoInstalacion,

            costoMateriales: command.costos.costoMateriales,

            costoManoObra: command.costos.costoManoObra,

            costoOtros: command.costos.costoOtros,

            montoCobradoCliente: command.costos.montoCobradoCliente,

            notas: command.costos.notas ?? null,
          }
        : undefined,
    });

    const created = await this.instalacionRepository.create(
      instalacion,
      tecnicos,
    );

    if (!created.id) {
      throw new Error('La instalación creada no tiene un id persistido.');
    }

    const procesamientoAcceso = await this.procesarAccesoInstalacion({
      instalacionId: created.id,
      command,
    });

    const detalle = await this.instalacionRepository.findDetailById({
      id: created.id,
    });

    if (!detalle) {
      throw new Error(
        'No fue posible obtener el detalle de la instalación creada.',
      );
    }

    return {
      detalle,

      acceso: procesamientoAcceso.acceso,

      prealtaPppoe: procesamientoAcceso.prealtaPppoe,
    };
  }

  private async procesarAccesoInstalacion({
    instalacionId,
    command,
  }: ProcesarAccesoInstalacionParams): Promise<ProcesarAccesoInstalacionResult> {
    const input = command.acceso;

    if (input.modo === ModoAccesoInstalacion.EXISTENTE) {
      const acceso = await this.vincularAccesoExistente({
        instalacionId,
        clienteId: command.clienteId,
        accesoInternetId: input.accesoInternetId,
      });

      return {
        acceso,

        /**
         * En este primer flujo no intentamos crear una prealta
         * automática para accesos existentes.
         */
        prealtaPppoe: this.crearResultadoPrealtaNoAplica(),
      };
    }

    const accesoCreado = await this.crearAccesoNuevo({
      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,

      tecnologia: input.tecnologia,
      metodoAutenticacion: input.metodoAutenticacion,
    });

    if (!accesoCreado.id) {
      throw new Error('El acceso creado no tiene un identificador persistido.');
    }

    await this.vincularInstalacionAcceso({
      instalacionId,
      accesoInternetId: accesoCreado.id,
      accion: AccionInstalacionAcceso.CREADO,
    });

    const prealtaPppoe = await this.procesarProvisionamientoNuevo({
      instalacionId,

      empresaId: command.empresaId,
      clienteId: command.clienteId,

      servicioInternetId: command.servicioInternetId ?? null,

      accesoInternetId: accesoCreado.id,

      tecnologia: accesoCreado.tecnologia,
      metodoAutenticacion: accesoCreado.metodoAutenticacion,

      mikrotikRouterId: input.mikrotikRouterId ?? null,

      generadoPorId: command.creadoPorId,
    });

    return {
      acceso: {
        accesoInternetId: accesoCreado.id,

        modo: ModoAccesoInstalacion.NUEVO,

        tecnologia: accesoCreado.tecnologia,

        metodoAutenticacion: accesoCreado.metodoAutenticacion,

        mikrotikRouterId: input.mikrotikRouterId ?? null,
      },

      prealtaPppoe,
    };
  }

  /**
   * Crea acceso para vincular
   * @param param0
   * @returns
   */
  private async crearAccesoNuevo({
    empresaId,
    clienteId,
    servicioInternetId,
    tecnologia,
    metodoAutenticacion,
  }: CrearAccesoNuevoParams): Promise<ClienteAccesoInternetEntity> {
    const entity = ClienteAccesoInternetEntity.create({
      empresaId,
      clienteId,
      servicioInternetId,
      tecnologia,
      metodoAutenticacion,
    });

    return this.accesoInternetRepository.create(entity);
  }

  private async vincularAccesoExistente({
    instalacionId,
    clienteId,
    accesoInternetId,
  }: VincularAccesoExistenteParams): Promise<ClienteInstalacionAccesoResult> {
    const accesoExistente =
      await this.accesoInternetRepository.findByIdForClient({
        accesoInternetId,
        clienteId,
      });

    if (!accesoExistente?.id) {
      throw new Error(
        'El acceso indicado no existe o no pertenece al cliente.',
      );
    }

    await this.vincularInstalacionAcceso({
      instalacionId,
      accesoInternetId: accesoExistente.id,
      accion: AccionInstalacionAcceso.MODIFICADO,
    });

    await this.handleAccesoExistente({
      instalacionId,
      accesoInternetId: accesoExistente.id,

      tecnologia: accesoExistente.tecnologia,

      metodoAutenticacion: accesoExistente.metodoAutenticacion,
    });

    return {
      accesoInternetId: accesoExistente.id,

      modo: ModoAccesoInstalacion.EXISTENTE,

      tecnologia: accesoExistente.tecnologia,

      metodoAutenticacion: accesoExistente.metodoAutenticacion,

      /**
       * El acceso existente no almacena actualmente
       * el MikroTik asociado.
       */
      mikrotikRouterId: null,
    };
  }

  /**
   * Vincula una instalacion con su respectivo acceso
   * @param param
   */
  private async vincularInstalacionAcceso({
    instalacionId,
    accesoInternetId,
    accion,
  }: VincularInstalacionAccesoParams): Promise<void> {
    const relacionExistente =
      await this.instalacionAccesoRepository.findByInstalacionAndAcceso({
        instalacionId,
        accesoInternetId,
      });

    if (relacionExistente) {
      throw new Error(
        'El acceso ya se encuentra vinculado a esta instalación.',
      );
    }

    const entity = ClienteInstalacionAccesoEntity.create({
      instalacionId,
      accesoInternetId,
      accion,
    });

    const relacionCreada =
      await this.instalacionAccesoRepository.create(entity);

    this.logger.log(
      `Acceso ${accesoInternetId} vinculado a la instalación ${instalacionId}. Relación: ${relacionCreada.id}.`,
    );
  }

  /**
   * Decide si provisionar un acceso IPV4/6 - DHCP - INHALAMBRICO O PPOE
   * @param param0
   * @returns
   */
  private async procesarProvisionamientoNuevo({
    instalacionId,
    empresaId,
    clienteId,
    servicioInternetId,
    accesoInternetId,
    tecnologia,
    metodoAutenticacion,
    mikrotikRouterId,
    generadoPorId,
  }: ProcesarProvisionamientoNuevoParams): Promise<PrealtaPppoeInstalacionResult> {
    const esGponPppoe =
      tecnologia === TecnologiaAccesoInternet.FIBRA_GPON &&
      metodoAutenticacion === MetodoAutenticacionInternet.PPPOE;

    if (esGponPppoe) {
      if (!servicioInternetId) {
        throw new Error(
          'Un acceso GPON con PPPoE requiere un servicio de internet.',
        );
      }

      if (!mikrotikRouterId) {
        throw new Error('Un acceso GPON con PPPoE requiere un MikroTik.');
      }

      return this.handleGponPppoe({
        instalacionId,

        empresaId,
        clienteId,
        servicioInternetId,

        accesoInternetId,
        mikrotikRouterId,

        generadoPorId,
      });
    }

    if (tecnologia === TecnologiaAccesoInternet.INALAMBRICO) {
      await this.handleAccesoInalambrico({
        instalacionId,
        accesoInternetId,
        tecnologia,
        metodoAutenticacion,
      });

      return this.crearResultadoPrealtaNoAplica();
    }

    if (metodoAutenticacion === MetodoAutenticacionInternet.IP_ESTATICA) {
      await this.handleAccesoIpEstatica({
        instalacionId,
        accesoInternetId,
        tecnologia,
        metodoAutenticacion,
      });

      return this.crearResultadoPrealtaNoAplica();
    }

    if (metodoAutenticacion === MetodoAutenticacionInternet.DHCP) {
      await this.handleAccesoDhcp({
        instalacionId,
        accesoInternetId,
        tecnologia,
        metodoAutenticacion,
      });

      return this.crearResultadoPrealtaNoAplica();
    }

    await this.handleAccesoGenerico({
      instalacionId,
      accesoInternetId,
      tecnologia,
      metodoAutenticacion,
    });

    return this.crearResultadoPrealtaNoAplica();
  }

  private crearResultadoPrealtaNoAplica(): PrealtaPppoeInstalacionResult {
    return {
      aplica: false,

      estado: EstadoResultadoPrealtaPppoe.NO_APLICA,

      cuentaPppoeId: null,
      perfilHomologacionId: null,
      usuario: null,
      estadoCuenta: null,
      generadoEn: null,

      mensaje: null,

      reintentable: false,
    };
  }
  private async handleGponPppoe({
    instalacionId,
    empresaId,
    clienteId,
    servicioInternetId,
    accesoInternetId,
    mikrotikRouterId,
    generadoPorId,
  }: ProvisionamientoGponPppoeParams): Promise<PrealtaPppoeInstalacionResult> {
    this.logger.log(
      `Preparando prealta GPON/PPPoE para el acceso ${accesoInternetId}.`,
    );

    try {
      const resultado = await this.pppoePrealta.preparar({
        instalacionId,

        empresaId,
        clienteId,
        servicioInternetId,

        accesoInternetId,
        mikrotikRouterId,

        /**
         * En la creación de la instalación, el operador que
         * origina la prealta es el usuario que registra la orden.
         */
        operadorId: generadoPorId,

        operadorNombre: null,
        ipOrigen: null,
        userAgent: null,
      });

      this.logger.log(
        resultado.creada
          ? `Prealta PPPoE creada para el acceso ${accesoInternetId}. Cuenta: ${resultado.cuentaPppoeId}.`
          : `El acceso ${accesoInternetId} ya tenía una prealta PPPoE. Cuenta: ${resultado.cuentaPppoeId}.`,
      );

      return {
        aplica: true,

        estado: resultado.creada
          ? EstadoResultadoPrealtaPppoe.CREADA
          : EstadoResultadoPrealtaPppoe.YA_EXISTIA,

        cuentaPppoeId: resultado.cuentaPppoeId,

        perfilHomologacionId: resultado.perfilHomologacionId,

        usuario: resultado.usuario,

        estadoCuenta: resultado.estado,

        generadoEn: resultado.generadoEn,

        mensaje: null,

        reintentable: false,
      };
    } catch (error: unknown) {
      const mensaje = this.obtenerMensajeSeguroPrealta(error);

      this.logger.error(
        `Falló la prealta GPON/PPPoE del acceso ${accesoInternetId}: ${mensaje}`,
        error instanceof Error ? error.stack : undefined,
      );

      return {
        aplica: true,

        estado: EstadoResultadoPrealtaPppoe.FALLIDA,

        cuentaPppoeId: null,
        perfilHomologacionId: null,
        usuario: null,
        estadoCuenta: null,
        generadoEn: null,

        mensaje,

        reintentable: true,
      };
    }
  }

  private obtenerMensajeSeguroPrealta(error: unknown): string {
    if (error instanceof HttpException) {
      const response = error.getResponse();

      if (typeof response === 'string') {
        return response;
      }

      if (
        typeof response === 'object' &&
        response !== null &&
        'message' in response
      ) {
        const message = (response as { message?: unknown }).message;

        if (typeof message === 'string' && message.trim()) {
          return message.trim();
        }

        if (Array.isArray(message)) {
          const messages = message.filter(
            (item): item is string =>
              typeof item === 'string' && item.trim().length > 0,
          );

          if (messages.length > 0) {
            return messages.join(' ');
          }
        }
      }
    }

    return 'No fue posible completar la prealta PPPoE. La instalación y el acceso fueron creados correctamente.';
  }

  private async handleAccesoInalambrico(
    params: ProvisionamientoPendienteParams,
  ): Promise<void> {
    this.logger.debug(
      `Provisionamiento inalámbrico pendiente para el acceso ${params.accesoInternetId}.`,
    );
  }

  private async handleAccesoIpEstatica(
    params: ProvisionamientoPendienteParams,
  ): Promise<void> {
    this.logger.debug(
      `Configuración de IP estática pendiente para el acceso ${params.accesoInternetId}.`,
    );
  }

  private async handleAccesoDhcp(
    params: ProvisionamientoPendienteParams,
  ): Promise<void> {
    this.logger.debug(
      `Configuración DHCP pendiente para el acceso ${params.accesoInternetId}.`,
    );
  }

  private async handleAccesoGenerico(
    params: ProvisionamientoPendienteParams,
  ): Promise<void> {
    this.logger.debug(
      `Provisionamiento genérico pendiente para el acceso ${params.accesoInternetId}.`,
    );
  }

  private async handleAccesoExistente(
    params: ProvisionamientoPendienteParams,
  ): Promise<void> {
    this.logger.debug(
      `Validación de acceso existente pendiente para el acceso ${params.accesoInternetId}.`,
    );
  }

  private normalizarTecnicos(
    tecnicos: CrearClienteInstalacionDto['tecnicos'] = [],
  ): CrearTecnicoInstalacionInput[] {
    const ids = tecnicos.map((tecnico) => tecnico.tecnicoId);

    if (new Set(ids).size !== ids.length) {
      throw new Error('No se puede asignar el mismo técnico más de una vez.');
    }

    const normalizados: CrearTecnicoInstalacionInput[] = tecnicos.map(
      (tecnico) => {
        const esResponsable =
          tecnico.esResponsable === true ||
          tecnico.rol === RolTecnicoOperacionCliente.RESPONSABLE;

        return {
          tecnicoId: tecnico.tecnicoId,

          rol: esResponsable
            ? RolTecnicoOperacionCliente.RESPONSABLE
            : (tecnico.rol ?? RolTecnicoOperacionCliente.APOYO),

          esResponsable,

          observaciones: tecnico.observaciones?.trim() || null,
        };
      },
    );

    const cantidadResponsables = normalizados.filter(
      (tecnico) => tecnico.esResponsable,
    ).length;

    if (cantidadResponsables > 1) {
      throw new Error(
        'Una instalación solo puede tener un técnico responsable.',
      );
    }

    return normalizados;
  }

  private parseCoordenadas(value?: string): {
    latitud: number;
    longitud: number;
  } | null {
    if (!value?.trim()) {
      return null;
    }

    const parts = value.split(',').map((part) => part.trim());

    if (parts.length !== 2) {
      throw new Error(
        'Las coordenadas deben tener el formato "latitud, longitud".',
      );
    }

    const latitud = Number(parts[0]);
    const longitud = Number(parts[1]);

    if (!Number.isFinite(latitud) || !Number.isFinite(longitud)) {
      throw new Error('Las coordenadas proporcionadas no son válidas.');
    }

    if (latitud < -90 || latitud > 90) {
      throw new Error('La latitud debe estar entre -90 y 90.');
    }

    if (longitud < -180 || longitud > 180) {
      throw new Error('La longitud debe estar entre -180 y 180.');
    }

    return {
      latitud,
      longitud,
    };
  }
}
