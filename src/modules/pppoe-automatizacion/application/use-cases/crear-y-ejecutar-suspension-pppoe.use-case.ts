import { Inject, Injectable } from '@nestjs/common';

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

import { EjecutarOperacionPppoeResult } from '../../public/pppoe-provisionamiento.port';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';

import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';

import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';

import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../ports/pppoe-operacion-auditoria.port';
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
 * Actor que solicita la suspensión.
 *
 * La identidad se conserva mediante iniciadoPorId
 * y su relación con Usuario.
 */
export type ActorSuspensionPppoeInput = {
  origen: OrigenOperacionPppoe;

  iniciadoPorId: number | null;

  operadorNombre?: string | null;

  ipOrigen?: string | null;

  userAgent?: string | null;
};

/**
 * Datos necesarios para crear y ejecutar
 * una operación SUSPENDER_SERVICIO.
 */
export type CrearYEjecutarSuspensionPppoeInput = {
  empresaId: number;

  cuentaPppoeId: number;

  claveIdempotencia: string;

  motivo: string;

  actor: ActorSuspensionPppoeInput;
};

/**
 * Crea y ejecuta una operación SUSPENDER_SERVICIO.
 *
 * Este caso de uso representa una suspensión inicial.
 *
 * Las suspensiones fallidas o parciales deben generar
 * una operación nueva mediante el flujo de reintento.
 */
@Injectable()
export class CrearYEjecutarSuspensionPppoeUseCase {
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
    input: CrearYEjecutarSuspensionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    /*
     * ========================================================
     * 1. CUENTA PPPoE
     * ========================================================
     */

    const cuenta = await this.cuentasPppoe.buscarPorId(input.cuentaPppoeId);

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    if (cuenta.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no contiene un identificador persistido.',
      );
    }

    if (cuenta.estaEliminada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede suspenderse una cuenta PPPoE eliminada.',
      );
    }

    /**
     * Una cuenta creada y activada por CRM dispone
     * normalmente de activadoEn.
     *
     * Una cuenta adoptada puede no conocer su fecha
     * histórica de activación. En ese caso adoptadoEn
     * confirma que su estado remoto fue verificado antes
     * de incorporarla al CRM.
     */
    const tieneActivacionConfirmada =
      cuenta.activadoEn !== null || cuenta.esAdoptada;

    /*
     * ========================================================
     * 2. HOMOLOGACIÓN ASIGNADA
     * ========================================================
     */

    const perfil = await this.perfilesHomologacion.buscarPorId(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new PerfilHomologacionNoEncontradoError();
    }

    const perfilProps = perfil;

    if (perfilProps.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación PPPoE no contiene un identificador persistido.',
      );
    }

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación recuperada no coincide con la cuenta PPPoE.',
      );
    }

    /*
     * ========================================================
     * 3. ROUTER MIKROTIK
     * ========================================================
     */

    const router = await this.routerRepository.findById(
      perfilProps.mikrotikRouterId,
    );

    if (!router) {
      throw new RouterMikrotikNoEncontradoError();
    }

    if (router.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'El router MikroTik no contiene un identificador persistido.',
      );
    }

    /*
     * ========================================================
     * 4. IDEMPOTENCIA PREVIA
     * ========================================================
     */

    const existingOperation = await this.operaciones.buscar({
      por: 'CLAVE_IDEMPOTENCIA',
      claveIdempotencia: input.claveIdempotencia,
    });

    if (existingOperation) {
      this.assertCompatibleExistingOperation({
        input,

        operacion: existingOperation,

        routerId: router.id,
      });

      return this.resolveOperation({
        empresaId: input.empresaId,

        operacion: existingOperation,

        estadoCuenta: cuenta.estado,

        cuentaTieneSecret: cuenta.tieneSecretCreado,

        cuentaTieneActivacionConfirmada: tieneActivacionConfirmada,
      });
    }

    /*
     * Una suspensión inicial solamente puede crearse
     * cuando la cuenta está actualmente ACTIVA.
     *
     * Para cuentas adoptadas no exigimos activadoEn,
     * porque esa fecha histórica puede ser desconocida.
     */
    this.assertAccountCanStartSuspension({
      estado: cuenta.estado,

      tieneSecret: cuenta.tieneSecretCreado,

      tieneActivacionConfirmada,
    });

    /*
     * ========================================================
     * 5. CREAR OPERACIÓN
     * ========================================================
     */

    const aggregate = await this.operaciones.crear({
      empresaId: input.empresaId,

      cuentaPppoeId: cuenta.id,

      mikrotikRouterId: router.id,

      perfilHomologacionId: perfilProps.id,

      /*
       * La suspensión manual actúa sobre la cuenta PPPoE,
       * no sobre la instalación que originó el acceso.
       */
      instalacionId: null,

      desinstalacionId: null,

      claveIdempotencia: input.claveIdempotencia.trim(),

      tipo: TipoOperacionPppoe.SUSPENDER_SERVICIO,

      origen: input.actor.origen,

      iniciadoPorId: input.actor.iniciadoPorId,

      requiereReautenticacion: false,

      motivo: input.motivo.trim(),

      usuarioPppoeSnapshot: cuenta.usuario,

      codigoPerfilSnapshot: perfilProps.codigoPerfil,

      routerHostSnapshot: router.host,

      routerPuertoSnapshot: router.sshPort,
    });

    if (aggregate.creada) {
      await this.operacionAuditoria.registrarCreada({
        operacion: aggregate.operacion,

        actor: {
          operadorId: input.actor.iniciadoPorId,

          operadorNombre: input.actor.operadorNombre ?? null,

          ipOrigen: input.actor.ipOrigen ?? null,

          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    /*
     * CrearPppoeOperacionUseCase puede devolver una operación
     * existente cuando otra solicitud ganó la carrera de
     * idempotencia.
     */
    return this.resolveOperation({
      empresaId: input.empresaId,

      operacion: aggregate.operacion,

      estadoCuenta: cuenta.estado,

      cuentaTieneSecret: cuenta.tieneSecretCreado,

      cuentaTieneActivacionConfirmada: tieneActivacionConfirmada,
    });
  }

  /**
   * Ejecuta la operación cuando continúa PENDIENTE.
   *
   * Cuando ya está EJECUTANDO o alcanzó un estado terminal,
   * devuelve el estado existente sin repetir SSH.
   */
  private async resolveOperation(params: {
    empresaId: number;

    operacion: PppoeOperacionReadModel;

    estadoCuenta: EstadoCuentaPppoe;

    cuentaTieneSecret: boolean;

    cuentaTieneActivacionConfirmada: boolean;
  }): Promise<EjecutarOperacionPppoeResult> {
    const operacionId = this.requireOperationId(params.operacion);

    if (params.operacion.esTerminal) {
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaEjecutando) {
      /*
       * Otra solicitud ya reclamó la operación.
       *
       * No se vuelve a abrir una sesión SSH.
       */
      return this.buildExistingResult({
        operacion: params.operacion,

        estadoCuenta: params.estadoCuenta,
      });
    }

    if (params.operacion.estaAutorizada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE está AUTORIZADA, pero este flujo de suspensión no utiliza reautenticación.',
      );
    }

    if (!params.operacion.estaPendiente) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `La operación PPPoE no puede ejecutarse desde el estado ${params.operacion.estado}.`,
      );
    }

    this.assertAccountCanStartSuspension({
      estado: params.estadoCuenta,

      tieneSecret: params.cuentaTieneSecret,

      tieneActivacionConfirmada: params.cuentaTieneActivacionConfirmada,
    });

    return this.ejecutarOperacion.execute({
      empresaId: params.empresaId,

      operacionId,
    });
  }

  /**
   * Valida una suspensión inicial.
   *
   * Una cuenta puede suspenderse cuando:
   *
   * - tiene un secret confirmado;
   * - dispone de activación confirmada;
   * - está actualmente ACTIVA.
   *
   * Para una cuenta normal, la activación se confirma
   * mediante activadoEn.
   *
   * Para una cuenta adoptada, se confirma mediante
   * su proceso previo de adopción.
   *
   * Una cuenta ERROR debe utilizar el flujo explícito
   * de reintento para conservar la cadena de operaciones.
   */
  private assertAccountCanStartSuspension(params: {
    estado: EstadoCuentaPppoe;

    tieneSecret: boolean;

    tieneActivacionConfirmada: boolean;
  }): void {
    if (!params.tieneSecret) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no tiene un secret confirmado que pueda suspenderse.',
      );
    }

    if (!params.tieneActivacionConfirmada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no tiene una activación confirmada y no puede suspenderse.',
      );
    }

    if (params.estado === EstadoCuentaPppoe.ERROR) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE está en ERROR. Debe utilizarse el flujo de reintento de operación.',
      );
    }

    if (params.estado !== EstadoCuentaPppoe.ACTIVA) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `No puede suspenderse la cuenta PPPoE desde el estado ${params.estado}.`,
      );
    }
  }

  /**
   * Evita reutilizar una clave de idempotencia
   * para una intención diferente.
   */
  private assertCompatibleExistingOperation(params: {
    input: CrearYEjecutarSuspensionPppoeInput;

    operacion: PppoeOperacionReadModel;

    routerId: number;
  }): void {
    const sameAccount =
      params.operacion.cuentaPppoeId === params.input.cuentaPppoeId;

    const sameRouter = params.operacion.mikrotikRouterId === params.routerId;

    const sameType =
      params.operacion.tipo === TipoOperacionPppoe.SUSPENDER_SERVICIO;

    const hasNoInstallation = params.operacion.instalacionId === null;

    const hasNoUninstallation = params.operacion.desinstalacionId === null;

    if (
      sameAccount &&
      sameRouter &&
      sameType &&
      hasNoInstallation &&
      hasNoUninstallation
    ) {
      return;
    }

    throw new OperacionPppoeIdempotenciaError(
      'La clave de idempotencia ya pertenece a una operación PPPoE diferente.',
    );
  }

  /**
   * Devuelve una operación existente sin repetir
   * acciones contra MikroTik.
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

  private requireOperationId(operacion: PppoeOperacionReadModel): number {
    if (operacion.id === null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE no contiene un identificador persistido.',
      );
    }

    return operacion.id;
  }

  private validateInput(input: CrearYEjecutarSuspensionPppoeInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    this.assertRequiredString(input.motivo, 'motivo');

    if (input.motivo.trim().length < 5) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'motivo debe contener al menos 5 caracteres.',
      );
    }

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
  }

  // comiteo

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
