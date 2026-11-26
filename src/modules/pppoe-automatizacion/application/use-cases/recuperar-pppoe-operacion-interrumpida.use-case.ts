import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { Inject, Injectable } from '@nestjs/common';
import { huboPosibleEfectoRemoto } from '../../domain/policies/efecto-remoto-pppoe.policy';
import { SincronizacionLocalPppoeService } from '../services/sincronizacion-local-pppoe.service';

import { ClientePppoeCuentaReadModel } from 'src/modules/pppoe-cliente-cuenta/public/pppoe-cliente-cuenta.types';

import { EstadoOperacionPppoe } from 'src/modules/pppoe-operacion/public/pppoe-operacion.types';

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
  constructor(
    @Inject(RELOJ) private readonly reloj: RelojPort,
    @Inject(PPPOE_OPERACION)
    private readonly operaciones: PppoeOperacionFacadePort,
    @Inject(PPPOE_OPERACION_AUDITORIA)
    private readonly operacionAuditoria: PppoeOperacionAuditoriaPort,

    @Inject(PPPOE_CLIENTE_CUENTA)
    private readonly cuentasPppoe: PppoeClienteCuentaFacadePort,
    private readonly sincronizacion: SincronizacionLocalPppoeService,
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

    const estadoFinal = huboPosibleEfectoRemoto(aggregate.pasos)
      ? EstadoOperacionPppoe.PARCIAL
      : EstadoOperacionPppoe.FALLIDA;

    const finalAggregate =
      estadoFinal === EstadoOperacionPppoe.PARCIAL
        ? await this.operaciones.finalizar({
            operacionId: input.operacionId,

            estadoFinal: EstadoOperacionPppoe.PARCIAL,

            errorCodigo,

            errorMensaje,

            resultado: null,

            fecha,
          })
        : await this.operaciones.finalizar({
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

    const estadoCuentaAnterior = cuenta.estado;

    // Lo mismo que una ejecución normal: cuenta, acceso y estado del cliente.
    ({ cuenta } = await this.sincronizacion.confirmarResultado(
      params.operacion,
      cuenta,
      params.fecha,
    ));

    const finalAggregate = await this.operaciones.finalizar({
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
    const fallo = {
      accion: 'MARCAR_FALLIDO' as const,
      errorCodigo: 'PPPOE_OPERACION_INTERRUMPIDA',
      fecha: params.fecha,
    };

    if (executingStep) {
      return this.operaciones.actualizarPaso({
        ...fallo,
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
      operacionId,
      selector,
      accion: 'INICIAR',
      comandoSanitizado: 'RECUPERAR_OPERACION_INTERRUMPIDA',
      fecha: params.fecha,
    });

    return this.operaciones.actualizarPaso({
      ...fallo,
      operacionId,
      selector,
      errorMensaje: 'La operación fue abandonada antes de ejecutar este paso.',
      respuestaSanitizada:
        'Interrupción registrada durante recuperación controlada.',
    });
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
