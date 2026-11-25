import { Inject, Injectable } from '@nestjs/common';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/public/pppoe-auditoria.types';

import {
  EstadoCuentaPppoe,
  FlujoActivacionCuentaPppoe,
  ClientePppoeCuentaDetalleActivacionAccion,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import {
  ActorOperacionPppoeInput,
  EjecutarOperacionPppoeResult,
} from '../../public/pppoe-provisionamiento.port';

import {
  CrearYEjecutarOperacionPppoeUseCase,
  ModoCreacionSecretPppoe,
} from './crear-y-ejecutar-operacion-pppoe.use-case';

import {
  CrearYEjecutarActivacionPppoeUseCase,
  ModoActivacionPppoe,
} from './crear-y-ejecutar-activacion-pppoe.use-case';
import { CuentaPppoeNoEncontradaError } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
} from '../../domain/errors/pppoe-automatizacion.errors';

export type ProvisionarPppoeClienteManualInput = {
  empresaId: number;

  cuentaPppoeId: number;

  actor: ActorOperacionPppoeInput;

  motivo?: string | null;
};

export type ProvisionarPppoeClienteManualResult = {
  cuentaPppoeId: number;

  completada: boolean;

  estadoCuenta: EstadoCuentaPppoe | null;

  creacionSecret: EjecutarOperacionPppoeResult | null;

  activacion: EjecutarOperacionPppoeResult | null;
};

/**
 * Ejecuta la primera activación de una cuenta creada
 * mediante ALTA_MANUAL.
 *
 * Este caso de uso no puede utilizarse para:
 *
 * - cuentas originadas por una instalación;
 * - cuentas adoptadas desde MikroTik;
 * - cuentas cuya acción de activación esté bloqueada;
 * - cuentas con operaciones que requieran reintento
 *   o recuperación.
 *
 * La política administrativa se obtiene desde
 * el detalle de la cuenta (PPPOE_CLIENTE_CUENTA.obtenerDetalle).
 *
 * La ejecución técnica continúa delegándose a:
 *
 * CREAR_SECRET
 *      ↓
 * ACTIVAR_SECRET
 */
@Injectable()
export class ProvisionarPppoeClienteManualUseCase {
  constructor(
    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,

    private readonly crearSecret: CrearYEjecutarOperacionPppoeUseCase,

    private readonly activarSecret: CrearYEjecutarActivacionPppoeUseCase,
  ) {}

  async execute(
    input: ProvisionarPppoeClienteManualInput,
  ): Promise<ProvisionarPppoeClienteManualResult> {
    this.validateInput(input);

    /**
     * Primero consultamos la política administrativa.
     *
     * Con esto impedimos que alguien invoque directamente
     * el endpoint /provisionar utilizando una cuenta
     * perteneciente a ClienteInstalacion.
     */
    const detalle = await this.cuentasPppoe.obtenerDetalle({
      cuentaPppoeId: input.cuentaPppoeId,
    });

    this.assertManualActivationAllowed(detalle.acciones.activar);

    /**
     * Recuperamos después el agregado porque los use cases
     * técnicos trabajan con la entidad de dominio y necesitamos
     * conocer tieneSecretCreado.
     */
    const cuenta = await this.cuentasPppoe.buscarPorId(input.cuentaPppoeId);

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    if (cuenta.empresaId !== input.empresaId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no pertenece a la empresa indicada.',
      );
    }

    const claveCrearSecret = this.buildCreationIdempotencyKey({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,
    });

    const claveActivarSecret = this.buildActivationIdempotencyKey({
      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,
    });

    /**
     * Recuperación después de un CREAR_SECRET que fue
     * resuelto correctamente mediante un reintento.
     *
     * En ese caso no ejecutamos nuevamente CREAR_SECRET.
     */
    const puedeContinuarDesdeSecretCreado =
      cuenta.estado === EstadoCuentaPppoe.EN_INSTALACION &&
      cuenta.tieneSecretCreado;

    let creacionSecret: EjecutarOperacionPppoeResult | null = null;

    if (!puedeContinuarDesdeSecretCreado) {
      creacionSecret = await this.crearSecret.execute({
        modo: ModoCreacionSecretPppoe.ALTA_MANUAL,

        empresaId: input.empresaId,

        cuentaPppoeId: input.cuentaPppoeId,

        claveIdempotencia: claveCrearSecret,

        actor: this.buildActor(input.actor),

        motivo: input.motivo ?? null,
      });

      /**
       * ACTIVAR_SECRET nunca debe ejecutarse mientras
       * CREAR_SECRET no haya finalizado correctamente.
       */
      if (creacionSecret.estadoOperacion !== EstadoOperacionPppoe.EXITOSA) {
        return {
          cuentaPppoeId: input.cuentaPppoeId,

          completada: false,

          estadoCuenta: creacionSecret.estadoCuenta,

          creacionSecret,

          activacion: null,
        };
      }
    }

    const activacion = await this.activarSecret.execute({
      modo: ModoActivacionPppoe.ALTA_MANUAL,

      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      claveIdempotencia: claveActivarSecret,

      actor: this.buildActor(input.actor),

      motivo: input.motivo ?? null,
    });

    const completada =
      activacion.estadoOperacion === EstadoOperacionPppoe.EXITOSA &&
      activacion.estadoCuenta === EstadoCuentaPppoe.ACTIVA;

    return {
      cuentaPppoeId: input.cuentaPppoeId,

      completada,

      estadoCuenta: activacion.estadoCuenta,

      creacionSecret,

      activacion,
    };
  }

  private assertManualActivationAllowed(
    accion: ClientePppoeCuentaDetalleActivacionAccion,
  ): void {
    /**
     * Primera barrera:
     *
     * este caso de uso sólo representa ALTA_MANUAL.
     */
    if (accion.flujo !== FlujoActivacionCuentaPppoe.ALTA_MANUAL) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no pertenece al flujo de alta manual.',
      );
    }

    /**
     * Una cuenta ALTA_MANUAL no debe depender de
     * ClienteInstalacion.
     */
    if (accion.instalacionId !== null) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE presenta un contexto de instalación incompatible con el flujo de alta manual.',
      );
    }

    /**
     * Segunda barrera:
     *
     * aunque sea ALTA_MANUAL, su estado actual puede
     * impedir la activación.
     */
    if (!accion.habilitada) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        accion.motivo ?? 'La cuenta PPPoE no puede activarse actualmente.',
      );
    }
  }

  private buildActor(
    actor: ActorOperacionPppoeInput,
  ): ActorOperacionPppoeInput {
    return {
      origen: actor.origen,

      iniciadoPorId: actor.iniciadoPorId,

      operadorNombre: actor.operadorNombre ?? null,

      ipOrigen: actor.ipOrigen ?? null,

      userAgent: actor.userAgent ?? null,
    };
  }

  private validateInput(input: ProvisionarPppoeClienteManualInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

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

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private buildCreationIdempotencyKey(params: {
    empresaId: number;

    cuentaPppoeId: number;
  }): string {
    return [
      'pppoe-alta-manual',

      'empresa',

      params.empresaId,

      'cuenta-pppoe',

      params.cuentaPppoeId,

      'crear-secret',
    ].join(':');
  }

  private buildActivationIdempotencyKey(params: {
    empresaId: number;

    cuentaPppoeId: number;
  }): string {
    return [
      'pppoe-alta-manual',

      'empresa',

      params.empresaId,

      'cuenta-pppoe',

      params.cuentaPppoeId,

      'activar-secret',
    ].join(':');
  }
}
