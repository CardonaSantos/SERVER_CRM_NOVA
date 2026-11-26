import { Inject, Injectable } from '@nestjs/common';

import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';
import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  PPPOE_PERFIL_HOMOLOGACION,
  PppoePerfilHomologacionFacadePort,
} from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.facade.port';

import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../ports/pppoe-operacion-auditoria.port';

import { EjecutarOperacionPppoeResult } from '../../public/pppoe-provisionamiento.port';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';
import {
  PPPOE_OPERACION,
  PppoeOperacionFacadePort,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.facade.port';
import { PppoeOperacionReadModel } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import { CuentaPppoeNoEncontradaError } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
  RouterMikrotikNoEncontradoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { PerfilHomologacionNoEncontradoError } from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.types';
import { OperacionPppoeIdempotenciaError } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

/**
 * Determina la intención comercial de ACTIVAR_SECRET.
 *
 * Ambas modalidades reutilizan la misma operación técnica,
 * pero tienen reglas de entrada diferentes.
 */
export enum ModoActivacionPppoe {
  INSTALACION = 'INSTALACION',
  ALTA_MANUAL = 'ALTA_MANUAL',
  REACTIVACION_MANUAL = 'REACTIVACION_MANUAL',
}

/**
 * Actor que solicita la activación o reactivación.
 */
export type ActorActivacionPppoeInput = {
  origen: OrigenOperacionPppoe;

  iniciadoPorId: number | null;
  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

type ActivacionPppoeBaseInput = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  actor: ActorActivacionPppoeInput;
};

/**
 * Activación provocada por el flujo de instalación.
 */
export type ActivacionPppoeInstalacionInput = ActivacionPppoeBaseInput & {
  modo: ModoActivacionPppoe.INSTALACION;

  instalacionId: number;

  motivo?: string | null;
};

/**
 * Primera activación administrativa de una cuenta PPPoE
 * creada fuera del flujo de instalación.
 *
 * No se relaciona con ClienteInstalacion.
 */
export type AltaPppoeManualInput = ActivacionPppoeBaseInput & {
  modo: ModoActivacionPppoe.ALTA_MANUAL;

  motivo?: string | null;
};

/**
 * Reactivación administrativa de una cuenta suspendida.
 */
export type ReactivacionPppoeManualInput = ActivacionPppoeBaseInput & {
  modo: ModoActivacionPppoe.REACTIVACION_MANUAL;

  motivo: string;
};

export type CrearYEjecutarActivacionPppoeInput =
  | ActivacionPppoeInstalacionInput
  | AltaPppoeManualInput
  | ReactivacionPppoeManualInput;

/**
 * Crea y ejecuta una operación ACTIVAR_SECRET.
 *
 * Modalidades:
 *
 * - INSTALACION:
 *   EN_INSTALACION | EN_ACTIVACION -> ACTIVA
 *
 * - REACTIVACION_MANUAL:
 *   SUSPENDIDA -> ACTIVA
 *
 * Las operaciones fallidas o parciales deben utilizar
 * el flujo explícito de reintento.
 */
@Injectable()
export class CrearYEjecutarActivacionPppoeUseCase {
  constructor(
    @Inject(PPPOE_OPERACION)
    private readonly operaciones: PppoeOperacionFacadePort,
    private readonly ejecutarOperacion: EjecutarPppoeOperacionUseCase,
    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
    @Inject(PPPOE_PERFIL_HOMOLOGACION)
    private readonly perfilesHomologacion: PppoePerfilHomologacionFacadePort,
    @Inject(MIKROTIK_ROUTER_REPOSITORY)
    private readonly routerRepository: MikrotikRouterRepositoryPort,
  ) {}

  async execute(
    input: CrearYEjecutarActivacionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    const claveIdempotencia = input.claveIdempotencia.trim();

    const cuenta = await this.cuentasPppoe.buscarPorId(input.cuentaPppoeId);

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    const cuentaId = cuenta.id;

    if (cuentaId === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    if (cuenta.estaEliminada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede activarse una cuenta PPPoE eliminada.',
      );
    }

    const perfil = await this.perfilesHomologacion.buscarPorId(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new PerfilHomologacionNoEncontradoError();
    }

    const perfilProps = perfil;

    const perfilHomologacionId = perfilProps.id;

    if (perfilHomologacionId === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE no contiene un identificador persistido.',
      );
    }

    if (perfilHomologacionId !== cuenta.perfilHomologacionId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE no coincide con la asignada a la cuenta.',
      );
    }

    const router = await this.routerRepository.findById(
      perfilProps.mikrotikRouterId,
    );

    if (!router) {
      throw new RouterMikrotikNoEncontradoError();
    }

    const routerId = router.id;

    if (routerId === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'El router MikroTik no contiene un identificador persistido.',
      );
    }

    const instalacionId = this.resolveInstalacionId(input);

    const motivo = this.resolveMotivo(input);

    const existingOperation = await this.operaciones.buscar({
      por: 'CLAVE_IDEMPOTENCIA',
      claveIdempotencia,
    });

    if (existingOperation) {
      this.assertCompatibleExistingOperation({
        input,
        operacion: existingOperation,
        routerId,
      });

      return this.resolveOperation({
        empresaId: input.empresaId,
        operacion: existingOperation,
        estadoCuenta: cuenta.estado,
        cuentaTieneSecret: cuenta.tieneSecretCreado,
        modo: input.modo,
      });
    }

    /*
     * Evita crear una operación PENDIENTE inválida.
     */
    this.assertAccountCanBeActivated({
      modo: input.modo,
      estado: cuenta.estado,
      tieneSecret: cuenta.tieneSecretCreado,
    });

    const aggregate = await this.operaciones.crear({
      empresaId: input.empresaId,
      cuentaPppoeId: cuentaId,
      mikrotikRouterId: routerId,
      perfilHomologacionId,
      instalacionId,
      desinstalacionId: null,
      claveIdempotencia,
      tipo: TipoOperacionPppoe.ACTIVAR_SECRET,
      origen: input.actor.origen,
      iniciadoPorId: input.actor.iniciadoPorId,
      requiereReautenticacion: false,
      motivo,
      usuarioPppoeSnapshot: cuenta.usuario,
      codigoPerfilSnapshot: perfilProps.codigoPerfil,
      routerHostSnapshot: router.host,
      routerPuertoSnapshot: router.sshPort,
    });

    /*
     * La auditoría de creación conserva el actor HTTP.
     */
    if (aggregate.creada) {
      await this.operacionAuditoria.registrarCreada({
        operacion: aggregate.operacion,
        actor: {
          operadorId: input.actor.iniciadoPorId,
          ipOrigen: input.actor.ipOrigen ?? null,
          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    /*
     * CrearPppoeOperacionUseCase también protege la
     * idempotencia frente a una carrera concurrente.
     */
    return this.resolveOperation({
      empresaId: input.empresaId,
      operacion: aggregate.operacion,
      estadoCuenta: cuenta.estado,
      cuentaTieneSecret: cuenta.tieneSecretCreado,
      modo: input.modo,
    });
  }

  /**
   * Ejecuta una operación PENDIENTE o devuelve
   * el resultado persistido si ya fue procesada.
   */
  private async resolveOperation(params: {
    empresaId: number;

    operacion: PppoeOperacionReadModel;

    estadoCuenta: EstadoCuentaPppoe;

    cuentaTieneSecret: boolean;

    modo: ModoActivacionPppoe;
  }): Promise<EjecutarOperacionPppoeResult> {
    const operacionId = this.requireOperationId(params.operacion);

    /*
     * La misma clave puede repetirse después
     * de que la operación terminó.
     */
    if (params.operacion.esTerminal) {
      return this.buildExistingResult({
        operacion: params.operacion,
        estadoCuenta: params.estadoCuenta,
      });
    }

    /*
     * Otra solicitud ya reclamó la operación.
     *
     * No se repite SSH.
     */
    if (params.operacion.estaEjecutando) {
      return this.buildExistingResult({
        operacion: params.operacion,
        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaAutorizada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE está AUTORIZADA, pero ACTIVAR_SECRET no utiliza reautenticación.',
      );
    }

    if (!params.operacion.estaPendiente) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `La operación PPPoE no puede ejecutarse desde el estado ${params.operacion.estado}.`,
      );
    }

    this.assertAccountCanBeActivated({
      modo: params.modo,
      estado: params.estadoCuenta,
      tieneSecret: params.cuentaTieneSecret,
    });

    return this.ejecutarOperacion.execute({
      empresaId: params.empresaId,
      operacionId,
    });
  }

  /**
   * Valida el estado local según la intención
   * comercial de ACTIVAR_SECRET.
   */
  private assertAccountCanBeActivated(params: {
    modo: ModoActivacionPppoe;

    estado: EstadoCuentaPppoe;

    tieneSecret: boolean;
  }): void {
    if (!params.tieneSecret) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no tiene un secret creado que pueda activarse.',
      );
    }

    /*
     * Un fallo debe conservar su cadena mediante
     * una operación nueva de reintento.
     */
    if (params.estado === EstadoCuentaPppoe.ERROR) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE está en ERROR. Debe utilizarse el flujo de reintento de operación.',
      );
    }

    if (params.modo === ModoActivacionPppoe.INSTALACION) {
      const estadosPermitidos: EstadoCuentaPppoe[] = [
        EstadoCuentaPppoe.EN_INSTALACION,
        EstadoCuentaPppoe.EN_ACTIVACION,
      ];

      if (!estadosPermitidos.includes(params.estado)) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `No puede activarse la cuenta PPPoE desde el estado ${params.estado} dentro del flujo de instalación.`,
        );
      }

      return;
    }

    if (params.modo === ModoActivacionPppoe.ALTA_MANUAL) {
      const estadosPermitidos: EstadoCuentaPppoe[] = [
        EstadoCuentaPppoe.EN_INSTALACION,
        EstadoCuentaPppoe.EN_ACTIVACION,
      ];

      if (!estadosPermitidos.includes(params.estado)) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `No puede realizarse el alta manual de la cuenta PPPoE desde el estado ${params.estado}.`,
        );
      }

      return;
    }

    if (params.modo === ModoActivacionPppoe.REACTIVACION_MANUAL) {
      if (params.estado !== EstadoCuentaPppoe.SUSPENDIDA) {
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `No puede reactivarse la cuenta PPPoE desde el estado ${params.estado}.`,
        );
      }

      return;
    }

    throw new ProvisionamientoPppoeEstadoInvalidoError(
      `Modo de activación PPPoE no soportado: ${params.modo}.`,
    );
  }

  /**
   * Evita reutilizar una clave de idempotencia
   * para una intención diferente.
   */
  private assertCompatibleExistingOperation(params: {
    input: CrearYEjecutarActivacionPppoeInput;

    operacion: PppoeOperacionReadModel;

    routerId: number;
  }): void {
    const expectedInstalacionId = this.resolveInstalacionId(params.input);

    const sameAccount =
      params.operacion.cuentaPppoeId === params.input.cuentaPppoeId;

    const sameRouter = params.operacion.mikrotikRouterId === params.routerId;

    const sameType =
      params.operacion.tipo === TipoOperacionPppoe.ACTIVAR_SECRET;

    const sameInstallation =
      params.operacion.instalacionId === expectedInstalacionId;

    const hasNoUninstallation = params.operacion.desinstalacionId === null;

    if (
      sameAccount &&
      sameRouter &&
      sameType &&
      sameInstallation &&
      hasNoUninstallation
    ) {
      return;
    }

    throw new OperacionPppoeIdempotenciaError(
      'La clave de idempotencia ya pertenece a una operación PPPoE diferente.',
    );
  }

  /**
   * Devuelve una operación existente sin repetir SSH.
   */
  private buildExistingResult(params: {
    operacion: PppoeOperacionReadModel;

    estadoCuenta: EstadoCuentaPppoe;
  }): EjecutarOperacionPppoeResult {
    const primitives = params.operacion;

    return {
      operacionId: this.requireOperationId(params.operacion),
      cuentaPppoeId: params.operacion.cuentaPppoeId,
      tipo: params.operacion.tipo,
      estadoOperacion: params.operacion.estado,
      estadoCuenta: params.estadoCuenta,
      numeroIntento: params.operacion.numeroIntento,
      reintentable: params.operacion.puedeReintentarse,
      resultado: primitives.resultado,
      errorCodigo: primitives.errorCodigo,
      errorMensaje: primitives.errorMensaje,
    };
  }

  /**
   * La instalación solamente se relaciona cuando
   * ACTIVAR_SECRET pertenece al flujo de instalación.
   */
  private resolveInstalacionId(
    input: CrearYEjecutarActivacionPppoeInput,
  ): number | null {
    if (input.modo === ModoActivacionPppoe.INSTALACION) {
      return input.instalacionId;
    }

    return null;
  }

  /**
   * La reactivación manual exige motivo explícito.
   *
   * La instalación puede utilizar un motivo descriptivo
   * predeterminado.
   */
  private resolveMotivo(input: CrearYEjecutarActivacionPppoeInput): string {
    if (input.modo === ModoActivacionPppoe.REACTIVACION_MANUAL) {
      return input.motivo.trim();
    }

    if (input.modo === ModoActivacionPppoe.ALTA_MANUAL) {
      return (
        input.motivo?.trim() ||
        'Activación administrativa inicial del servicio PPPoE.'
      );
    }

    return (
      input.motivo?.trim() ||
      'Activación del servicio PPPoE durante la instalación.'
    );
  }

  private requireOperationId(operacion: PppoeOperacionReadModel): number {
    if (operacion.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE no contiene un identificador persistido.',
      );
    }

    return operacion.id;
  }

  private validateInput(input: CrearYEjecutarActivacionPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');
    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');
    this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    if (!input.actor) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'actor es obligatorio.',
      );
    }

    if (input.actor.iniciadoPorId !== null) {
      this.assertPositiveInteger(
        input.actor.iniciadoPorId,
        'actor.iniciadoPorId',
      );
    }

    if (
      input.actor.origen === OrigenOperacionPppoe.OPERADOR &&
      input.actor.iniciadoPorId === null
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'actor.iniciadoPorId es obligatorio cuando el origen es OPERADOR.',
      );
    }

    if (input.modo === ModoActivacionPppoe.INSTALACION) {
      this.assertPositiveInteger(input.instalacionId, 'instalacionId');

      return;
    }

    if (input.modo === ModoActivacionPppoe.ALTA_MANUAL) {
      return;
    }

    if (input.modo === ModoActivacionPppoe.REACTIVACION_MANUAL) {
      this.assertRequiredString(input.motivo, 'motivo');

      if (input.motivo.trim().length < 5) {
        throw new ProvisionamientoPppoeDatosInvalidosError(
          'motivo debe contener al menos 5 caracteres.',
        );
      }

      return;
    }

    throw new ProvisionamientoPppoeDatosInvalidosError(
      `Modo de activación PPPoE no soportado: ${String(
        (input as { modo?: unknown }).modo,
      )}.`,
    );
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `${field} es obligatorio.`,
      );
    }
  }
}
