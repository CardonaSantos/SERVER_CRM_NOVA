import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { Inject, Injectable } from '@nestjs/common';

import {
  ClientePppoeCuentaReadModel,
  EstadoCuentaPppoe,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
  TipoPasoPppoe,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

import { EjecutarOperacionPppoeResult } from '../../public/pppoe-provisionamiento.port';
import {
  PPPOE_CLIENTE_CUENTA,
  PppoeClienteCuentaFacadePort,
} from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.facade.port';
import {
  PPPOE_OPERACION_AUDITORIA,
  PppoeOperacionAuditoriaPort,
} from '../ports/pppoe-operacion-auditoria.port';
import {
  PPPOE_OPERACION,
  PppoeOperacionFacadePort,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.facade.port';
import {
  PppoeOperacionAgregadoReadModel,
  PppoeOperacionPasoReadModel,
  PppoeOperacionReadModel,
} from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';
import {
  ProvisionamientoPppoeDatosInvalidosError,
  ProvisionamientoPppoeEstadoInvalidoError,
} from '../../domain/errors/pppoe-automatizacion.errors';
import { CuentaPppoeNoEncontradaError } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';
import { OperacionPppoeNoEncontradaError } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

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
    @Inject(RELOJ) private readonly reloj: RelojPort,
    @Inject(PPPOE_OPERACION)
    private readonly operaciones: PppoeOperacionFacadePort,
    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
  ) {}

  async execute(
    input: RecuperarPppoeOperacionInterrumpidaInput,
  ): Promise<EjecutarOperacionPppoeResult> {
    this.validateInput(input);

    const fecha = input.fecha ?? this.reloj.ahora();

    let aggregate = await this.loadAggregate({
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    const { operacion } = aggregate;

    /**
     * La recuperación es idempotente cuando la operación
     * ya alcanzó un estado terminal.
     */
    if (operacion.esTerminal) {
      return this.buildResult({
        operacion,

        cuenta: await this.findAccountSafely(operacion.cuentaPppoeId),
      });
    }

    if (!operacion.estaEjecutando) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        `La operación PPPoE no está EJECUTANDO. Estado actual: ${operacion.estado}.`,
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
        ? await this.operaciones.finalizar({
            empresaId: input.empresaId,

            operacionId: input.operacionId,

            estadoFinal: EstadoOperacionPppoe.PARCIAL,

            errorCodigo,

            errorMensaje,

            resultado: null,

            fecha,
          })
        : await this.operaciones.finalizar({
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

    operacion: PppoeOperacionReadModel;

    fecha: Date;
  }): Promise<EjecutarOperacionPppoeResult> {
    let cuenta = await this.cuentasPppoe.buscarPorId(
      params.operacion.cuentaPppoeId,
    );

    if (!cuenta) {
      throw new CuentaPppoeNoEncontradaError();
    }

    if (cuenta.empresaId !== params.empresaId) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La cuenta PPPoE no pertenece a la empresa de la operación.',
      );
    }

    const estadoCuentaAnterior = cuenta.estado;

    cuenta = await this.applyConfirmedRemoteResult({
      operacion: params.operacion,

      cuenta,

      fecha: params.fecha,
    });

    const finalAggregate = await this.operaciones.finalizar({
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
    operacion: PppoeOperacionReadModel;

    cuenta: ClientePppoeCuentaReadModel;

    fecha: Date;
  }): Promise<ClientePppoeCuentaReadModel> {
    switch (params.operacion.tipo) {
      case TipoOperacionPppoe.CREAR_SECRET:
        if (params.cuenta.tieneSecretCreado) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_INSTALACION) {
          throw new ProvisionamientoPppoeEstadoInvalidoError(
            `No puede reconciliarse CREAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        return this.cuentasPppoe.cambiarEstado({
          cuentaPppoeId: params.cuenta.id,
          transicion: 'MARCAR_SECRET_CREADO',
          fecha: params.fecha,
        });

      case TipoOperacionPppoe.ACTIVAR_SECRET:
        if (params.cuenta.estaActiva) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_ACTIVACION) {
          throw new ProvisionamientoPppoeEstadoInvalidoError(
            `No puede reconciliarse ACTIVAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        return this.cuentasPppoe.cambiarEstado({
          cuentaPppoeId: params.cuenta.id,
          transicion: 'MARCAR_ACTIVA',
          fecha: params.fecha,
        });

      case TipoOperacionPppoe.SUSPENDER_SERVICIO:
        if (params.cuenta.estaSuspendida) {
          return params.cuenta;
        }

        if (
          params.cuenta.estado !== EstadoCuentaPppoe.ACTIVA &&
          params.cuenta.estado !== EstadoCuentaPppoe.ERROR
        ) {
          throw new ProvisionamientoPppoeEstadoInvalidoError(
            `No puede reconciliarse SUSPENDER_SERVICIO con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        return this.cuentasPppoe.cambiarEstado({
          cuentaPppoeId: params.cuenta.id,
          transicion: 'MARCAR_SUSPENDIDA',
          fecha: params.fecha,
        });

      case TipoOperacionPppoe.ELIMINAR_SECRET:
        /*
         * La cuenta pudo actualizarse antes de que
         * la operación alcanzara el estado EXITOSA.
         */
        if (params.cuenta.estaEliminada) {
          return params.cuenta;
        }

        if (params.cuenta.estado !== EstadoCuentaPppoe.EN_DESINSTALACION) {
          throw new ProvisionamientoPppoeEstadoInvalidoError(
            `No puede reconciliarse ELIMINAR_SECRET con la cuenta en estado ${params.cuenta.estado}.`,
          );
        }

        return this.cuentasPppoe.cambiarEstado({
          cuentaPppoeId: params.cuenta.id,
          transicion: 'MARCAR_ELIMINADA',
          fecha: params.fecha,
        });

      default:
        throw new ProvisionamientoPppoeEstadoInvalidoError(
          `La recuperación todavía no admite operaciones de tipo ${params.operacion.tipo}.`,
        );
    }
  }

  /**
   * Garantiza que la operación incompleta contenga
   * al menos un paso FALLIDO.
   */
  private async ensureInterruptedFailure(params: {
    aggregate: PppoeOperacionAgregadoReadModel;

    fecha: Date;
  }): Promise<PppoeOperacionAgregadoReadModel> {
    const { operacion, pasos } = params.aggregate;

    const failedStep = pasos.find((paso) => paso.fueFallido);

    if (failedStep) {
      return params.aggregate;
    }

    const executingStep = pasos.find((paso) => paso.estaEjecutando);

    const operacionId = this.requireOperationId(operacion);
    const empresaId = operacion.empresaId;
    const fallo = {
      accion: 'MARCAR_FALLIDO' as const,
      errorCodigo: 'PPPOE_OPERACION_INTERRUMPIDA',
      fecha: params.fecha,
    };

    if (executingStep) {
      return this.operaciones.actualizarPaso({
        ...fallo,
        empresaId,
        operacionId,
        selector: { pasoId: executingStep.id },
        errorMensaje:
          'El proceso terminó mientras este paso se encontraba EJECUTANDO.',
        respuestaSanitizada:
          'Paso cerrado durante la recuperación de una operación interrumpida.',
      });
    }

    const pendingStep = [...pasos]
      .sort((left, right) => left.orden - right.orden)
      .find((paso) => paso.estaPendiente);

    if (!pendingStep) {
      throw new ProvisionamientoPppoeEstadoInvalidoError(
        'La operación PPPoE no contiene un paso disponible para registrar la interrupción.',
      );
    }

    // El paso nunca comenzó: se inicia y falla con la misma fecha para dejar
    // un estado terminal coherente y duración cero.
    const selector = { pasoId: pendingStep.id };
    await this.operaciones.actualizarPaso({
      empresaId,
      operacionId,
      selector,
      accion: 'INICIAR',
      comandoSanitizado: 'RECUPERAR_OPERACION_INTERRUMPIDA',
      fecha: params.fecha,
    });

    return this.operaciones.actualizarPaso({
      ...fallo,
      empresaId,
      operacionId,
      selector,
      errorMensaje: 'La operación fue abandonada antes de ejecutar este paso.',
      respuestaSanitizada:
        'Interrupción registrada durante recuperación controlada.',
    });
  }

  /**
   * PARCIAL requiere evidencia de un posible efecto remoto.
   *
   * Sin esa evidencia la operación se considera FALLIDA.
   */
  private resolveInterruptedFinalState(
    pasos: PppoeOperacionPasoReadModel[],
  ): EstadoOperacionPppoe.PARCIAL | EstadoOperacionPppoe.FALLIDA {
    const possibleRemoteEffect = pasos.some(
      (paso) =>
        RecuperarPppoeOperacionInterrumpidaUseCase.PASOS_CON_EFECTO_REMOTO.has(
          paso.tipo,
        ) &&
        (paso.fueExitoso || paso.fueFallido),
    );

    return possibleRemoteEffect
      ? EstadoOperacionPppoe.PARCIAL
      : EstadoOperacionPppoe.FALLIDA;
  }

  /**
   * Todos los pasos deben haber terminado correctamente
   * o haber sido omitidos idempotentemente.
   */
  private allStepsSuccessful(pasos: PppoeOperacionPasoReadModel[]): boolean {
    return (
      pasos.length > 0 &&
      pasos.every((paso) => paso.fueExitoso || paso.fueOmitido)
    );
  }

  private async registerAccountErrorSafely(params: {
    cuentaPppoeId: number;

    errorMensaje: string;

    fecha: Date;
  }): Promise<ClientePppoeCuentaReadModel | null> {
    try {
      const cuenta = await this.cuentasPppoe.buscarPorId(params.cuentaPppoeId);

      if (!cuenta || cuenta.estaEliminada) {
        return cuenta;
      }

      return await this.cuentasPppoe.registrarError({
        cuentaPppoeId: cuenta.id,
        mensaje: params.errorMensaje,
        fecha: params.fecha,
      });
    } catch {
      return null;
    }
  }

  private async findAccountSafely(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaReadModel | null> {
    try {
      return await this.cuentasPppoe.buscarPorId(cuentaPppoeId);
    } catch {
      return null;
    }
  }

  private async loadAggregate(params: {
    empresaId: number;

    operacionId: number;
  }): Promise<PppoeOperacionAgregadoReadModel> {
    const aggregate = await this.operaciones.buscarAgregado({
      empresaId: params.empresaId,

      operacionId: params.operacionId,
    });

    if (!aggregate) {
      throw new OperacionPppoeNoEncontradaError();
    }

    return aggregate;
  }

  private buildResult(params: {
    operacion: PppoeOperacionReadModel;

    cuenta: ClientePppoeCuentaReadModel | null;
  }): EjecutarOperacionPppoeResult {
    const primitives = params.operacion;

    return {
      operacionId: this.requireOperationId(params.operacion),

      cuentaPppoeId: params.operacion.cuentaPppoeId,

      tipo: params.operacion.tipo,

      estadoOperacion: params.operacion.estado,

      estadoCuenta: params.cuenta?.estado ?? null,

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

  private assertRecoveryDate(
    operacion: PppoeOperacionReadModel,

    fecha: Date,
  ): void {
    if (
      operacion.iniciadoEn &&
      fecha.getTime() < operacion.iniciadoEn.getTime()
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'La fecha de recuperación no puede ser anterior al inicio de la operación.',
      );
    }
  }

  private validateInput(input: RecuperarPppoeOperacionInterrumpidaInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    if (input.confirmarAbandono !== true) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'confirmarAbandono debe ser true para recuperar la operación.',
      );
    }

    if (
      input.fecha !== undefined &&
      (!(input.fecha instanceof Date) || Number.isNaN(input.fecha.getTime()))
    ) {
      throw new ProvisionamientoPppoeDatosInvalidosError(
        'fecha debe contener una fecha válida.',
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
}
