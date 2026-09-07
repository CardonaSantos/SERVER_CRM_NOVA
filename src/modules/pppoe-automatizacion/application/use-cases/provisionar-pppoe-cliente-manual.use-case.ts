import { BadRequestException, Injectable } from '@nestjs/common';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  ActorOperacionPppoeInput,
  EjecutarOperacionPppoeResult,
} from '../../domain/props/pppoe-provisionamiento.props';

import {
  CrearYEjecutarOperacionPppoeUseCase,
  ModoCreacionSecretPppoe,
} from './crear-y-ejecutar-operacion-pppoe.use-case';

import {
  CrearYEjecutarActivacionPppoeUseCase,
  ModoActivacionPppoe,
} from './crear-y-ejecutar-activacion-pppoe.use-case';

export type ProvisionarPppoeClienteManualInput = {
  empresaId: number;

  cuentaPppoeId: number;

  actor: ActorOperacionPppoeInput;

  motivo?: string | null;
};

export type ProvisionarPppoeClienteManualResult = {
  cuentaPppoeId: number;

  /**
   * true únicamente cuando CREAR_SECRET y
   * ACTIVAR_SECRET finalizaron correctamente.
   */
  completada: boolean;

  /**
   * Estado de cuenta conocido al terminar
   * la orquestación.
   */
  estadoCuenta: EstadoCuentaPppoe | null;

  /**
   * Resultado de la creación del secret.
   */
  creacionSecret: EjecutarOperacionPppoeResult;

  /**
   * null cuando CREAR_SECRET no terminó EXITOSA
   * y, por seguridad, no se intentó activar.
   */
  activacion: EjecutarOperacionPppoeResult | null;
};

/**
 * Provisiona una cuenta PPPoE ya preparada mediante
 * el flujo administrativo/manual.
 *
 * Este caso de uso NO:
 *
 * - crea instalaciones;
 * - crea ClienteInstalacionAcceso;
 * - construye comandos RouterOS;
 * - abre sesiones SSH directamente.
 *
 * Orquesta los casos de uso técnicos existentes:
 *
 * 1. CREAR_SECRET en modo ALTA_MANUAL.
 * 2. ACTIVAR_SECRET en modo ALTA_MANUAL.
 */
@Injectable()
export class ProvisionarPppoeClienteManualUseCase {
  private static readonly MAX_OPERATION_IDEMPOTENCY_LENGTH = 200;

  constructor(
    private readonly crearSecret: CrearYEjecutarOperacionPppoeUseCase,

    private readonly activarSecret: CrearYEjecutarActivacionPppoeUseCase,
  ) {}

  async execute(
    input: ProvisionarPppoeClienteManualInput,
  ): Promise<ProvisionarPppoeClienteManualResult> {
    this.validateInput(input);

    // const claveBase = input.claveIdempotencia.trim();

    // const claveCrearSecret = this.buildIdempotencyKey(
    //   claveBase,
    //   'crear-secret',
    // );

    // const claveActivarSecret = this.buildIdempotencyKey(
    //   claveBase,
    //   'activar-secret',
    // );
    const claveCrearSecret = this.buildCreationIdempotencyKey({
      empresaId: input.empresaId,
      cuentaPppoeId: input.cuentaPppoeId,
    });

    const claveActivarSecret = this.buildActivationIdempotencyKey({
      empresaId: input.empresaId,
      cuentaPppoeId: input.cuentaPppoeId,
    });

    /*
     * ========================================================
     * 1. CREAR SECRET
     * ========================================================
     *
     * La operación técnica existente:
     *
     * PENDIENTE_ACTIVACION
     *        ->
     * EN_INSTALACION
     *
     * y deja secretCreadoEn informado.
     *
     * No existe instalación asociada.
     */
    const creacionSecret = await this.crearSecret.execute({
      modo: ModoCreacionSecretPppoe.ALTA_MANUAL,

      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      claveIdempotencia: claveCrearSecret,

      actor: {
        origen: input.actor.origen,

        iniciadoPorId: input.actor.iniciadoPorId,

        operadorNombre: input.actor.operadorNombre ?? null,

        ipOrigen: input.actor.ipOrigen ?? null,

        userAgent: input.actor.userAgent ?? null,
      },

      motivo: input.motivo ?? null,
    });

    /*
     * CREAR_SECRET puede devolver una operación:
     *
     * - FALLIDA;
     * - PARCIAL;
     * - EJECUTANDO en una llamada concurrente;
     * - etc.
     *
     * En cualquiera de esos casos NO debemos iniciar
     * ACTIVAR_SECRET.
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

    /*
     * ========================================================
     * 2. ACTIVAR SECRET
     * ========================================================
     *
     * Solamente llegamos aquí cuando CREAR_SECRET terminó
     * correctamente.
     *
     * El caso de uso de activación comprobará nuevamente:
     *
     * - empresa;
     * - cuenta;
     * - homologación;
     * - router;
     * - estado;
     * - existencia local del secret.
     */
    const activacion = await this.activarSecret.execute({
      modo: ModoActivacionPppoe.ALTA_MANUAL,

      empresaId: input.empresaId,

      cuentaPppoeId: input.cuentaPppoeId,

      claveIdempotencia: claveActivarSecret,

      actor: {
        origen: input.actor.origen,

        iniciadoPorId: input.actor.iniciadoPorId,

        operadorNombre: input.actor.operadorNombre ?? null,

        ipOrigen: input.actor.ipOrigen ?? null,

        userAgent: input.actor.userAgent ?? null,
      },

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

  private validateInput(input: ProvisionarPppoeClienteManualInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.cuentaPppoeId, 'cuentaPppoeId');

    // this.assertRequiredString(input.claveIdempotencia, 'claveIdempotencia');

    if (!input.actor) {
      throw new BadRequestException('actor es obligatorio.');
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
      throw new BadRequestException(
        'actor.iniciadoPorId es obligatorio cuando el origen es OPERADOR.',
      );
    }

    /*
     * Validamos las dos claves derivadas ahora para fallar
     * antes de comenzar cualquier efecto remoto.
     */
    // const claveBase = input.claveIdempotencia.trim();

    // this.buildIdempotencyKey(claveBase, 'crear-secret');

    // this.buildIdempotencyKey(claveBase, 'activar-secret');
  }

  private buildIdempotencyKey(
    base: string,
    suffix: 'crear-secret' | 'activar-secret',
  ): string {
    const key = `${base}:${suffix}`;

    if (
      key.length >
      ProvisionarPppoeClienteManualUseCase.MAX_OPERATION_IDEMPOTENCY_LENGTH
    ) {
      throw new BadRequestException(
        `La clave de idempotencia es demasiado larga para generar la operación ${suffix}.`,
      );
    }

    return key;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }

  private assertRequiredString(value: string, field: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new BadRequestException(`${field} es obligatorio.`);
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
