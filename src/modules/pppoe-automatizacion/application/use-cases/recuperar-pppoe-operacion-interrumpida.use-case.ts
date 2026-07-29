import {
  BadRequestException,
  ConflictException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ClientePppoeCuentaEntity } from 'src/modules/pppoe-cliente-cuenta/domain/entities/ppoe-cliente-cuenta.entity';

import { EstadoCuentaPppoe } from 'src/modules/pppoe-cliente-cuenta/domain/enums/pppoe-cliente-cuenta.enum';

import { FinalizarPppoeOperacionUseCase } from 'src/modules/pppoe-operacion/application/use-cases/finalizar-pppoe-operacion.use-case';

import { PppoeOperacionEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion.entity';

import { PppoeOperacionPasoEntity } from 'src/modules/pppoe-operacion/domain/entities/pppoe-operacion-paso.entity';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from 'src/modules/pppoe-operacion/domain/ports/pppoe-operacion-repository.port';

import { EjecutarOperacionPppoeResult } from '../../domain/props/pppoe-provisionamiento.props';
import {
  CLIENTE_PPPOE_CUENTA_REPOSITORY,
  ClientePppoeCuentaRepositoryPort,
} from 'src/modules/pppoe-cliente-cuenta/domain/ports/pppoe-cliente-cuenta.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../../domain/ports/pppoe-operacion-auditoria.port';

/**
 * Datos necesarios para recuperar una operación
 * cuya ejecución ya fue confirmada como abandonada.
 */
export type RecuperarPppoeOperacionInterrumpidaInput = {
  empresaId: number;

  operacionId: number;

  /**
   * Debe enviarse expresamente.
   *
   * Evita cerrar por accidente una operación que todavía
   * podría estar siendo ejecutada por otro proceso.
   */
  confirmarAbandono: true;

  /**
   * Fecha efectiva de recuperación.
   *
   * Si se omite, se utiliza la fecha actual.
   */
  fecha?: Date;
};

/**
 * Recupera una operación PPPoE que quedó EJECUTANDO.
 *
 * No repite comandos SSH sobre la misma operación.
 *
 * Cuando los pasos técnicos ya terminaron correctamente,
 * completa la sincronización local.
 *
 * Cuando la ejecución quedó incompleta, registra el fallo,
 * finaliza la operación y permite crear un nuevo intento.
 */
@Injectable()
export class RecuperarPppoeOperacionInterrumpidaUseCase {
  /**
   * Pasos que pueden haber modificado RouterOS.
   *
   * Debe permanecer alineado con
   * FinalizarPppoeOperacionUseCase.
   */
  private static readonly PASOS_CON_EFECTO_REMOTO = new Set<TipoPasoPppoe>([
    TipoPasoPppoe.AGREGAR_SECRET,

    TipoPasoPppoe.HABILITAR_SECRET,

    TipoPasoPppoe.DESHABILITAR_SECRET,

    TipoPasoPppoe.REMOVER_SESION_ACTIVA,

    TipoPasoPppoe.ELIMINAR_SECRET,
  ]);

  constructor(
    private readonly finalizarOperacion: FinalizarPppoeOperacionUseCase,

    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly operacionRepository: PppoeOperacionRepositoryPort,

    @Inject(CLIENTE_PPPOE_CUENTA_REPOSITORY)
    private readonly cuentaRepository: ClientePppoeCuentaRepositoryPort,
  ) {}

  async execute(
    input: RecuperarPppoeOperacionInterrumpidaInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    const fecha = input.fecha ?? new Date();

    let aggregate = await this.loadAggregate({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    const { operacion } = aggregate;

    /**
     * La recuperación es idempotente cuando la operación
     * ya alcanzó un estado terminal.
     */
    if (operacion.esTerminal()) {
      return this.buildResult({
        operacion,

        cuenta: await this.findAccountSafely(operacion.cuentaPppoeId),
      });
    }

    if (!operacion.estaEjecutando()) {
      throw new ConflictException(
        `La operación PPPoE ${input.operacionId} no está EJECUTANDO. Estado actual: ${operacion.estado}.`,
      );
    }

    this.assertRecoveryDate(operacion, fecha);

    /**
     * Todos los pasos técnicos terminaron correctamente,
     * pero la sincronización local o la finalización de la
     * operación quedó interrumpida.
     */
    if (this.allStepsSuccessful(aggregate.pasos)) {
      return this.reconcileSuccessfulExecution({
        empresaId: input.empresaId,

        operacion,

        fecha,
      });
    }

    /**
     * La operación quedó técnicamente incompleta.
     *
     * Se garantiza que exista un paso FALLIDO antes
     * de finalizarla.
     */
    aggregate = await this.ensureInterruptedFailure({
      aggregate,

      fecha,
    });

    const errorCodigo = 'PPPOE_OPERACION_INTERRUMPIDA';

    const errorMensaje =
      'La ejecución PPPoE fue interrumpida antes de completar todos sus pasos técnicos.';

    const cuentaAntesDeRecuperar = await this.findAccountSafely(
      aggregate.operacion.cuentaPppoeId,
    );

    const estadoCuentaAnterior = cuentaAntesDeRecuperar?.estado ?? null;

    const cuenta = await this.registerAccountErrorSafely({
      cuentaPppoeId: aggregate.operacion.cuentaPppoeId,

      errorMensaje,

      fecha,
    });

    const estadoFinal = this.resolveInterruptedFinalState(aggregate.pasos);

    const finalAggregate =
      estadoFinal === EstadoOperacionPppoe.PARCIAL
        ? await this.finalizarOperacion.execute({
            empresaId: input.empresaId,

            operacionId: input.operacionId,

            estadoFinal: EstadoOperacionPppoe.PARCIAL,

            errorCodigo,

            errorMensaje,

            resultado: null,

            fecha,
          })
        : await this.finalizarOperacion.execute({
            empresaId: input.empresaId,

            operacionId: input.operacionId,

            estadoFinal: EstadoOperacionPppoe.FALLIDA,

            errorCodigo,

            errorMensaje,

            resultado: null,

            fecha,
          });

    const cuentaFinal =
      cuenta ??
      (await this.findAccountSafely(finalAggregate.operacion.cuentaPppoeId));

    await this.operacionAuditoria.registrarFinalizada({
      operacion: finalAggregate.operacion,

      estadoCuentaAnterior,

      estadoCuentaNuevo: cuentaFinal?.estado ?? null,

      fecha,
    });

    await this.operacionAuditoria.registrarRecuperada({
      operacion: finalAggregate.operacion,

      estadoCuentaAnterior,

      estadoCuentaNuevo: cuentaFinal?.estado ?? null,

      recuperacion:
        estadoFinal === EstadoOperacionPppoe.PARCIAL
          ? 'CERRADA_COMO_PARCIAL'
          : 'CERRADA_COMO_FALLIDA',

      fecha,
    });

    return this.buildResult({
      operacion: finalAggregate.operacion,

      cuenta: cuentaFinal,
    });
  }

  /**
   * Completa una operación cuyos pasos ya terminaron
   * como EXITOSOS u OMITIDOS.
   */
  private async reconcileSuccessfulExecution(params: {
    empresaId: number;

    operacion: PppoeOperacionEntity;

    fecha: Date;
  }): Promise<EjecutarOperacionPppoeResult> {
    let cuenta = await this.cuentaRepository.findById(
      params.operacion.cuentaPppoeId,
    );

    if (!cuenta) {
      throw new NotFoundException(
        `No existe la cuenta PPPoE ${params.operacion.cuentaPppoeId} vinculada a la operación.`,
      );
    }

    if (cuenta.empresaId !== params.empresaId) {
      throw new ConflictException(
        'La cuenta PPPoE no pertenece a la empresa de la operación.',
      );
    }

    const estadoCuentaAnterior = cuenta.estado;

    cuenta = await this.applyConfirmedRemoteResult({
      operacion: params.operacion,

      cuenta,

      fecha: params.fecha,
    });

    const finalAggregate = await this.finalizarOperacion.execute({
      empresaId: params.empresaId,

      operacionId: this.requireOperationId(params.operacion),

      estadoFinal: EstadoOperacionPppoe.EXITOSA,

      resultado: {
        recuperacionLocal: true,

        pasosRemotosConfirmados: true,
      },

      fecha: params.fecha,
    });

    await this.operacionAuditoria.registrarFinalizada({
      operacion: finalAggregate.operacion,

      estadoCuentaAnterior,

      estadoCuentaNuevo: cuenta.estado,

      fecha: params.fecha,
    });

    await this.operacionAuditoria.registrarRecuperada({
      operacion: finalAggregate.operacion,

      estadoCuentaAnterior,

      estadoCuentaNuevo: cuenta.estado,

      recuperacion: 'SINCRONIZACION_LOCAL_COMPLETADA',

      fecha: params.fecha,
    });

    return this.buildResult({
      operacion: finalAggregate.operacion,

      cuenta,
    });
  }

  /**
   * Aplica idempotentemente el resultado remoto
   * confirmado sobre la cuenta local.
   */
  private async applyConfirmedRemoteResult(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaEntity;

    fecha: Date;
  }): Promise<ClientePppoeCuentaEntity> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        if (params.cuenta.tieneSecretCreado) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_INSTALACION) {
          throw new ConflictException(
            `No puede reconciliarse CREAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        params.cuenta.marcarSecretCreado(params.fecha);

        return this.cuentaRepository.update(params.cuenta);

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        if (params.cuenta.estaActiva) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_ACTIVACION) {
          throw new ConflictException(
            `No puede reconciliarse ACTIVAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        params.cuenta.marcarActiva(params.fecha);

        return this.cuentaRepository.update(params.cuenta);

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        if (params.cuenta.estaSuspendida) {
          return params.cuenta;
        }

        if (
          params.cuenta.estado !== EstadoCuentaPppoe.ACTIVA &&
          params.cuenta.estado !== EstadoCuentaPppoe.ERROR
        ) {
          throw new ConflictException(
            `No puede reconciliarse SUSPENDER_SERVICIO con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        params.cuenta.marcarSuspendida(params.fecha);

        return this.cuentaRepository.update(params.cuenta);

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        /*
         * La cuenta pudo actualizarse antes de que
         * la operación alcanzara el estado EXITOSA.
         */
        if (params.cuenta.estaEliminada) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_DESINSTALACION) {
          throw new ConflictException(
            `No puede reconciliarse ELIMINAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        params.cuenta.marcarEliminada(params.fecha);

        return this.cuentaRepository.update(params.cuenta);

      default:
        throw new ConflictException(
          `La recuperación todavía no admite operaciones de tipo ${params.operacion.tipo}.`,
        );
    }
  }

  /**
   * Garantiza que la operación incompleta contenga
   * al menos un paso FALLIDO.
   */
  private async ensureInterruptedFailure(params: {
    aggregate: PppoeOperacionAggregate;

    fecha: Date;
  }): Promise<PppoeOperacionAggregate> {
    const { operacion, pasos } = params.aggregate;

    const failedStep = pasos.find((paso) => paso.fueFallido());

    if (failedStep) {
      return params.aggregate;
    }

    const executingStep = pasos.find((paso) => paso.estaEjecutando());

    if (executingStep) {
      executingStep.marcarFallido({
        errorCodigo: 'PPPOE_OPERACION_INTERRUMPIDA',

        errorMensaje:
          'El proceso terminó mientras este paso se encontraba EJECUTANDO.',

        respuestaSanitizada:
          'Paso cerrado durante la recuperación de una operación interrumpida.',

        fecha: params.fecha,
      });

      await this.operacionRepository.saveStep({
        empresaId: operacion.empresaId,

        paso: executingStep,
      });

      return this.loadAggregate({
        empresaId: operacion.empresaId,

        operacionId: this.requireOperationId(operacion),
      });
    }

    const pendingStep = [...pasos]
      .sort((left, right) => left.orden - right.orden)
      .find((paso) => paso.estaPendiente());

    if (!pendingStep) {
      throw new ConflictException(
        `La operación PPPoE ${operacion.id} no contiene un paso disponible para registrar la interrupción.`,
      );
    }

    /**
     * El paso nunca comenzó técnicamente.
     *
     * Se inicia y falla con la misma fecha únicamente para
     * dejar un estado terminal coherente y duración cero.
     */
    pendingStep.iniciar({
      comandoSanitizado: 'RECUPERAR_OPERACION_INTERRUMPIDA',

      fecha: params.fecha,
    });

    pendingStep.marcarFallido({
      errorCodigo: 'PPPOE_OPERACION_INTERRUMPIDA',

      errorMensaje: 'La operación fue abandonada antes de ejecutar este paso.',

      respuestaSanitizada:
        'Interrupción registrada durante recuperación controlada.',

      fecha: params.fecha,
    });

    await this.operacionRepository.saveStep({
      empresaId: operacion.empresaId,

      paso: pendingStep,
    });

    return this.loadAggregate({
      empresaId: operacion.empresaId,

      operacionId: this.requireOperationId(operacion),
    });
  }

  /**
   * PARCIAL requiere evidencia de un posible efecto remoto.
   *
   * Sin esa evidencia la operación se considera FALLIDA.
   */
  private resolveInterruptedFinalState(
    pasos: PppoeOperacionPasoEntity[],
  ): EstadoOperacionPppoe.PARCIAL | EstadoOperacionPppoe.FALLIDA {
    const possibleRemoteEffect = pasos.some(
      (paso) =>
        RecuperarPppoeOperacionInterrumpidaUseCase.PASOS_CON_EFECTO_REMOTO.has(
          paso.tipo,
        ) &&
        (paso.fueExitoso() || paso.fueFallido()),
    );

    return possibleRemoteEffect
      ? EstadoOperacionPppoe.PARCIAL
      : EstadoOperacionPppoe.FALLIDA;
  }

  /**
   * Todos los pasos deben haber terminado correctamente
   * o haber sido omitidos idempotentemente.
   */
  private allStepsSuccessful(pasos: PppoeOperacionPasoEntity[]): boolean {
    return (
      pasos.length > 0 &&
      pasos.every((paso) => paso.fueExitoso() || paso.fueOmitido())
    );
  }

  private async registerAccountErrorSafely(params: {
    cuentaPppoeId: number;

    errorMensaje: string;

    fecha: Date;
  }): Promise<ClientePppoeCuentaEntity | null> {
    try {
      const cuenta = await this.cuentaRepository.findById(params.cuentaPppoeId);

      if (!cuenta || cuenta.estaEliminada) {
        return cuenta;
      }

      cuenta.registrarError(params.errorMensaje, params.fecha);

      return await this.cuentaRepository.update(cuenta);
    } catch {
      return null;
    }
  }

  private async findAccountSafely(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaEntity | null> {
    try {
      return await this.cuentaRepository.findById(cuentaPppoeId);
    } catch {
      return null;
    }
  }

  private async loadAggregate(params: {
    empresaId: number;

    operacionId: number;
  }): Promise<PppoeOperacionAggregate> {
    const aggregate = await this.operacionRepository.findAggregateById({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    if (!aggregate) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${params.operacionId}.`,
      );
    }

    return aggregate;
  }

  private buildResult(params: {
    operacion: PppoeOperacionEntity;

    cuenta: ClientePppoeCuentaEntity | null;
  }): EjecutarOperacionPppoeResult {
    const primitives = params.operacion.toPrimitives();

    return {
      operacionId: this.requireOperationId(params.operacion),

      cuentaPppoeId: params.operacion.cuentaPppoeId,

      tipo: params.operacion.tipo,

      estadoOperacion: params.operacion.estado,

      estadoCuenta: params.cuenta?.estado ?? null,

      numeroIntento: params.operacion.numeroIntento,

      reintentable: params.operacion.puedeReintentarse(),

      resultado: primitives.resultado,

      errorCodigo: primitives.errorCodigo,

      errorMensaje: primitives.errorMensaje,
    };
  }

  private requireOperationId(operacion: PppoeOperacionEntity): number {
    if (operacion.id === null) {
      throw new ConflictException(
        'La operación PPPoE no contiene un identificador persistido.',
      );
    }

    return operacion.id;
  }

  private assertRecoveryDate(
    operacion: PppoeOperacionEntity,

    fecha: Date,
  ): void {
    if (
      operacion.iniciadoEn &&
      fecha.getTime() < operacion.iniciadoEn.getTime()
    ) {
      throw new BadRequestException(
        'La fecha de recuperación no puede ser anterior al inicio de la operación.',
      );
    }
  }

  private validateInput(input: RecuperarPppoeOperacionInterrumpidaInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    if (input.confirmarAbandono !== true) {
      throw new BadRequestException(
        'confirmarAbandono debe ser true para recuperar la operación.',
      );
    }

    if (
      input.fecha !== undefined &&
      (!(input.fecha instanceof Date) || Number.isNaN(input.fecha.getTime()))
    ) {
      throw new BadRequestException('fecha debe contener una fecha válida.');
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
