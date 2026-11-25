import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeEstadoInvalidoError,
  OperacionPppoeNoEncontradaError,
} from '../../domain/errors/pppoe-operacion.errors';

/**
 * Datos necesarios para cancelar una operación.
 */
export type CancelarPppoeOperacionUseCaseInput = {
  empresaId: number;

  operacionId: number;

  motivo: string;

  fecha?: Date;
};

/**
 * Cancela una operación antes de que comience
 * su ejecución técnica.
 */
@Injectable()
export class CancelarPppoeOperacionUseCase {
  private static readonly MAX_MOTIVO_LENGTH = 2_000;

  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,

    @Inject(RELOJ)
    private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: CancelarPppoeOperacionUseCaseInput,
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
     * Repetir la cancelación no genera otra actualización.
     */
    if (operacion.fueCancelada()) {
      return aggregate;
    }

    if (operacion.estaEjecutando()) {
      throw new OperacionPppoeEstadoInvalidoError(
        'La operación ya comenzó y no puede cancelarse.',
      );
    }

    if (operacion.esTerminal()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación ya finalizó en estado ${operacion.estado}.`,
      );
    }

    if (!operacion.estaPendiente() && !operacion.estaAutorizada()) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación no puede cancelarse desde el estado ${operacion.estado}.`,
      );
    }

    /**
     * Una operación no iniciada debería conservar
     * todos sus pasos en PENDIENTE.
     */
    const pasoProcesado = pasos.find((paso) => !paso.estaPendiente());

    if (pasoProcesado) {
      throw new OperacionPppoeEstadoInvalidoError(
        `La operación no puede cancelarse porque el paso ${pasoProcesado.orden} está en estado ${pasoProcesado.estado}.`,
      );
    }

    operacion.cancelar({
      motivo: input.motivo,
      fecha: input.fecha ?? this.reloj.ahora(),
    });

    const savedOperation = await this.repository.saveOperation(operacion);

    return {
      operacion: savedOperation,
      pasos,
    };
  }

  private validateInput(input: CancelarPppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');

    this.assertMotivo(input.motivo);

    this.assertOptionalDate(input.fecha);
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new OperacionPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }

  private assertMotivo(value: string): void {
    if (typeof value !== 'string' || !value.trim()) {
      throw new OperacionPppoeDatosInvalidosError('motivo es obligatorio.');
    }

    if (value.trim().length > CancelarPppoeOperacionUseCase.MAX_MOTIVO_LENGTH) {
      throw new OperacionPppoeDatosInvalidosError(
        `motivo no puede superar ${
          CancelarPppoeOperacionUseCase.MAX_MOTIVO_LENGTH
        } caracteres.`,
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
