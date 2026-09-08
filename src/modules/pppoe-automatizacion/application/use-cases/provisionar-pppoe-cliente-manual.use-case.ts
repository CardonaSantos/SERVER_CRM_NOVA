import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';

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
   * true cuando al terminar la orquestación
   * la activación fue exitosa y la cuenta quedó ACTIVA.
   */
  completada: boolean;

  /**
   * Estado conocido de la cuenta al finalizar.
   */
  estadoCuenta: EstadoCuentaPppoe | null;

  /**
   * Resultado de CREAR_SECRET.
   *
   * Es null cuando el secret ya había sido confirmado
   * previamente, por ejemplo después de un reintento
   * exitoso de CREAR_SECRET.
   */
  creacionSecret: EjecutarOperacionPppoeResult | null;

  /**
   * Resultado de ACTIVAR_SECRET.
   *
   * Es null cuando CREAR_SECRET no pudo completarse
   * y por seguridad no se intentó activar.
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
 * 1. CREAR_SECRET en modo ALTA_MANUAL cuando sea necesario.
 * 2. ACTIVAR_SECRET en modo ALTA_MANUAL.
 *
 * Si CREAR_SECRET ya fue confirmado previamente,
 * se continúa directamente con ACTIVAR_SECRET.
 */
@Injectable()
export class ProvisionarPppoeClienteManualUseCase {
  constructor(
    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,

    private readonly crearSecret: CrearYEjecutarOperacionPppoeUseCase,

    private readonly activarSecret: CrearYEjecutarActivacionPppoeUseCase,
  ) {}

  async execute(
    input: ProvisionarPppoeClienteManualInput,
  ): Promise<ProvisionarPppoeClienteManualResult> {
    this.validateInput(input);

    /*
     * ========================================================
     * 1. CUENTA PPPoE
     * ========================================================
     */

    const cuenta = await this.cuentaRepository.findById(input.cuentaPppoeId);

    if (!cuenta) {
      throw new NotFoundException(
        `No existe la cuenta PPPoE ${input.cuentaPppoeId}.`,
      );
    }

    if (cuenta.empresaId !== input.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa indicada.',
      );
    }

    /*
     * ========================================================
     * 2. CLAVES IDEMPOTENTES DEL ALTA MANUAL
     * ========================================================
     */

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
     * 3. DETERMINAR SI CREAR_SECRET TODAVÍA ES NECESARIO
     * ========================================================
     *
     * Caso normal:
     *
     * PENDIENTE_ACTIVACION
     *        ->
     * CREAR_SECRET
     *
     *
     * Caso de recuperación:
     *
     * CREAR_SECRET FALLIDA
     *        ->
     * REINTENTO EXITOSO
     *        ->
     * EN_INSTALACION + secretCreadoEn
     *
     * En ese escenario no debemos volver a resolver
     * la operación raíz fallida.
     *
     * El secret ya existe y fue confirmado.
     * Continuamos directamente con ACTIVAR_SECRET.
     */

    const puedeContinuarDesdeSecretCreado =
      cuenta.estado === EstadoCuentaPppoe.EN_INSTALACION &&
      cuenta.tieneSecretCreado;

    let creacionSecret: EjecutarOperacionPppoeResult | null = null;

    /*
     * ========================================================
     * 4. CREAR SECRET CUANDO SEA NECESARIO
     * ========================================================
     */

    if (!puedeContinuarDesdeSecretCreado) {
      creacionSecret = await this.crearSecret.execute({
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
       * No se activa mientras CREAR_SECRET no haya
       * terminado correctamente.
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

    /*
     * ========================================================
     * 5. ACTIVAR SECRET
     * ========================================================
     *
     * Llegamos aquí cuando:
     *
     * A) CREAR_SECRET acaba de terminar EXITOSA.
     *
     * o
     *
     * B) un reintento previo ya confirmó el secret y
     *    encontramos:
     *
     *    EN_INSTALACION + tieneSecretCreado
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
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
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
