import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { EstadoOperacionPppoe } from '../../domain/enums/pppoe-operacion.enum';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEnCursoError,
  OperacionPppoeEstadoInvalidoError,
  OperacionPppoeNoEncontradaError,
} from '../../domain/errors/pppoe-operacion.errors';

/**
 * Datos necesarios para iniciar una operación.
 */
export type IniciarPppoeOperacionUseCaseInput = {
  empresaId: number;

  operacionId: number;

  /**
   * Si se omite, se toma del reloj.
   */
  fecha?: Date;
};

/**
 * Reclama e inicia una operación PPPoE.
 *
 * Sin reautenticación:
 *
 * PENDIENTE -> EJECUTANDO
 *
 * Con reautenticación:
 *
 * AUTORIZADA -> EJECUTANDO
 *
 * La transición se persiste mediante compare-and-set para
 * impedir que dos procesos ejecuten simultáneamente la misma
 * operación sobre MikroTik.
 */
@Injectable()
export class IniciarPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: IniciarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate> {
    this.validateInput(input);

    const aggregate = await this.repository.findAggregateById({
      empresaId: input.empresaId,
      operacionId: input.operacionId,
    });

    if (!aggregate) {
      throw new OperacionPppoeNoEncontradaError();
    }

    const { operacion, pasos } = aggregate;

    /**
     * Una operación EJECUTANDO ya fue reclamada.
     *
     * No se devuelve como una ejecución idempotente porque
     * eso permitiría que otra solicitud repitiera los
     * comandos SSH.
     */
    if (operacion.estaEjecutando()) {
      throw new OperacionPppoeEnCursoError(
        'La operación PPPoE ya está en ejecución.',
      );
    }

    if (operacion.esTerminal()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación no puede iniciarse desde el estado ${operacion.estado}.`,
      );
    }

    this.validateAuthorizationState(operacion);

    if (pasos.length === 0) {
      throw new OperacionPppoeEstadoInvalidoError(
        'La operación no contiene pasos técnicos.',
      );
    }

    /**
     * Una operación nueva solamente puede reclamarse cuando
     * todos sus pasos permanecen PENDIENTES.
     *
     * Si algún paso ya comenzó, la operación debe pasar por
     * el flujo explícito de recuperación.
     */
    const pasoNoPendiente = pasos.find((paso) => !paso.estaPendiente());

    if (pasoNoPendiente) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación no puede iniciarse porque el paso ${pasoNoPendiente.orden} se encuentra en estado ${pasoNoPendiente.estado}.`,
      );
    }

    const estadoEsperado = operacion.requiereReautenticacion
      ? EstadoOperacionPppoe.AUTORIZADA
      : EstadoOperacionPppoe.PENDIENTE;

    /**
     * La transición se aplica primero sobre la entidad.
     *
     * El repositorio utilizará los datos resultantes para
     * realizar el compare-and-set atómico.
     */
    operacion.iniciar({
      fecha: input.fecha ?? this.reloj.ahora(),
    });

    const claimedOperation = await this.repository.claimForExecution({
      empresaId: input.empresaId,
      operacionId: input.operacionId,
      estadoEsperado,
      operacionIniciada: operacion,
    });

    /**
     * count = 0 dentro del repositorio significa que otra
     * solicitud cambió el estado antes que esta.
     */
    if (!claimedOperation) {
      throw new OperacionPppoeEnCursoError(
        'La operación PPPoE ya fue tomada por otro proceso o cambió de estado.',
      );
    }

    /**
     * Recargamos el agregado para devolver el estado realmente
     * persistido y una colección actualizada de pasos.
     */
    const claimedAggregate = await this.repository.findAggregateById({
      empresaId: input.empresaId,
      operacionId: input.operacionId,
    });

    if (!claimedAggregate) {
      throw new OperacionPppoeEstadoInvalidoError(
        'La operación PPPoE se inició, pero no pudo recargarse.',
      );
    }

    if (!claimedAggregate.operacion.estaEjecutando()) {
      throw new OperacionPppoeEstadoInvalidoError(
        'La operación PPPoE no quedó en ejecución después de iniciarse.',
      );
    }

    return claimedAggregate;
  }

  private validateAuthorizationState(
    operacion: PppoeOperacionAggregate['operacion'],
  ): void {
    if (operacion.requiereReautenticacion) {
      if (!operacion.estaAutorizada()) {
        throw new OperacionPppoeEstadoInvalidoError(
          `La operación requiere autorización antes de ejecutarse. Estado actual: ${operacion.estado}.`,
        );
      }

      return;
    }

    if (!operacion.estaPendiente()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación sin reautenticación debe estar PENDIENTE. Estado actual: ${operacion.estado}.`,
      );
    }
  }

  private validateInput(input: IniciarPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');
    this.assertPositiveInteger(input.operacionId, 'operacionId');
    this.assertOptionalDate(input.fecha);
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new OperacionPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private assertOptionalDate(value?: Date): void {
    if (value === undefined) {
      return;
    }

    if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
      throw new OperacionPppoeDatosInvalidosError(
        'fecha debe contener una fecha válida.',
      );
    }
  }
}
