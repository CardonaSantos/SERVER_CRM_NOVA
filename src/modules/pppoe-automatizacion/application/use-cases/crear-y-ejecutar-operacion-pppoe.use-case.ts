import { Inject, Injectable } from '@nestjs/common';

import { TipoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import {
  PPPOE_PERFIL_HOMOLOGACION,
  PppoePerfilHomologacionFacadePort,
} from 'src/modules/pppoe-perfil-homologacion/public/pppoe-perfil-homologacion.facade.port';

import {
  CrearSecretPppoeInput,
  EjecutarOperacionPppoeResult,
  EjecutarProvisionamientoPppoeBaseInput,
} from '../../public/pppoe-provisionamiento.port';

import { EjecutarPppoeOperacionUseCase } from './ejecutar-pppoe-operacion.use-case';
import { MIKROTIK_ROUTER_REPOSITORY } from 'src/mikro-tik/infra/tokens/mikrotik-router.tokens';
import { MikrotikRouterRepositoryPort } from 'src/mikro-tik/domain/ports/mikrotik-router-repository.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../ports/pppoe-operacion-auditoria.port';
import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';
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

/**
 * Determina el origen comercial de CREAR_SECRET.
 *
 * La operación técnica es la misma, pero puede pertenecer
 * a una instalación o a una provisión administrativa.
 */
export enum ModoCreacionSecretPppoe {
  INSTALACION = 'INSTALACION',
  ALTA_MANUAL = 'ALTA_MANUAL',
}

/**
 * Creación del secret fuera del flujo de instalación.
 */
export type CrearSecretPppoeAltaManualInput =
  EjecutarProvisionamientoPppoeBaseInput & {
    modo: ModoCreacionSecretPppoe.ALTA_MANUAL;
  };

/**
 * Conservamos compatibilidad con el flujo actual de instalación.
 *
 * `modo` es opcional para las llamadas existentes:
 * si no se proporciona, se interpreta como INSTALACION.
 */
export type CrearYEjecutarOperacionPppoeInput =
  | (CrearSecretPppoeInput & {
      modo?: ModoCreacionSecretPppoe.INSTALACION;
    })
  | CrearSecretPppoeAltaManualInput;

/**
 * Crea y ejecuta una operación CREAR_SECRET.
 *
 * Responsabilidades:
 *
 * - recuperar la cuenta;
 * - recuperar la homologación vinculada;
 * - recuperar el router;
 * - construir snapshots no sensibles;
 * - crear la operación idempotente;
 * - ejecutar la operación cuando todavía no ha comenzado;
 * - devolver operaciones terminales ya existentes sin repetir SSH.
 */
@Injectable()
export class CrearYEjecutarOperacionPppoeUseCase {
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
    input: CrearYEjecutarOperacionPppoeInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    const cuenta = await this.cuentasPppoe.buscarPorId(input.cuentaPppoeId);

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    if (cuenta.estaEliminada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'No puede crearse un secret para una cuenta PPPoE eliminada.',
      );
    }

    const perfil = await this.perfilesHomologacion.buscarPorId(
      cuenta.perfilHomologacionId,
    );

    if (!perfil) {
      throw new PerfilHomologacionNoEncontradoError();
    }

    const perfilProps = perfil;

    if (perfilProps.id !== cuenta.perfilHomologacionId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La homologación recuperada no coincide con la cuenta PPPoE.',
      );
    }

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

    const instalacionId = this.resolveInstalacionId(input);

    const motivo = this.resolveMotivo(input);

    const aggregate = await this.operaciones.crear({
      empresaId: input.empresaId,
      cuentaPppoeId: input.cuentaPppoeId,
      mikrotikRouterId: router.id,
      perfilHomologacionId: perfilProps.id,
      instalacionId: instalacionId,
      desinstalacionId: null,
      claveIdempotencia: input.claveIdempotencia,
      tipo: TipoOperacionPppoe.CREAR_SECRET,
      origen: input.actor.origen,
      iniciadoPorId: input.actor.iniciadoPorId,
      /*
       * El inicio de instalación ya representa
       * una acción autorizada del flujo.
       *
       * No se solicita una segunda contraseña.
       */
      requiereReautenticacion: false,
      motivo: motivo,
      usuarioPppoeSnapshot: cuenta.usuario,
      codigoPerfilSnapshot: perfilProps.codigoPerfil,
      routerHostSnapshot: router.host,
      routerPuertoSnapshot: router.sshPort,
    });

    const operacion = aggregate.operacion;

    const operacionId = this.requireOperationId(operacion);

    /*
     * No se duplica la auditoría cuando la misma clave
     * idempotente devuelve una operación existente.
     */
    if (aggregate.creada) {
      await this.operacionAuditoria.registrarCreada({
        operacion,
        actor: {
          operadorId: input.actor.iniciadoPorId,
          operadorNombre: input.actor.operadorNombre ?? null,
          ipOrigen: input.actor.ipOrigen ?? null,
          userAgent: input.actor.userAgent ?? null,
        },
      });
    }

    if (operacion.esTerminal) {
      return this.buildExistingResult({
        operacion,
        estadoCuenta: cuenta.estado,
      });
    }

    if (operacion.estaEjecutando) {
      /*
       * La misma clave pudo llegar nuevamente mientras
       * el primer proceso todavía ejecuta SSH.
       *
       * No repetimos comandos ni intentamos reclamar
       * nuevamente la operación.
       */
      return this.buildExistingResult({
        operacion,
        estadoCuenta: cuenta.estado,
      });
    }

    if (operacion.estaAutorizada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE está AUTORIZADA, pero este flujo automático no utiliza reautenticación.',
      );
    }

    if (!operacion.estaPendiente) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `La operación PPPoE no puede ejecutarse desde el estado ${operacion.estado}.`,
      );
    }

    return this.ejecutarOperacion.execute({
      empresaId: input.empresaId,
      operacionId,
    });
  }

  /**
   * Construye una respuesta para una operación existente
   * que no debe volver a ejecutarse.
   */
  private buildExistingResult(params: {
    operacion: PppoeOperacionReadModel;

    estadoCuenta: EjecutarOperacionPppoeResult['estadoCuenta'];
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

  private validateInput(input: CrearYEjecutarOperacionPppoeInput): void {
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

    /*
     * ALTA_MANUAL no pertenece a una instalación.
     */
    if (input.modo === ModoCreacionSecretPppoe.ALTA_MANUAL) {
      return;
    }

    /*
     * Aquí solamente puede quedar:
     *
     * - INSTALACION
     * - undefined (compatibilidad con el flujo anterior)
     */
    this.assertPositiveInteger(input.instalacionId, 'instalacionId');
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

  /**
   * CREAR_SECRET únicamente conserva instalación
   * cuando pertenece al flujo tradicional.
   */
  private resolveInstalacionId(
    input: CrearYEjecutarOperacionPppoeInput,
  ): number | null {
    if (input.modo === ModoCreacionSecretPppoe.ALTA_MANUAL) {
      return null;
    }

    return input.instalacionId;
  }

  /**
   * Describe correctamente el origen comercial
   * de la creación del secret.
   */
  private resolveMotivo(input: CrearYEjecutarOperacionPppoeInput): string {
    if (input.modo === ModoCreacionSecretPppoe.ALTA_MANUAL) {
      return (
        input.motivo?.trim() ||
        'Creación administrativa inicial del secret PPPoE.'
      );
    }

    return (
      input.motivo?.trim() ||
      'Creación automática del secret PPPoE al iniciar la instalación.'
    );
  }
}
