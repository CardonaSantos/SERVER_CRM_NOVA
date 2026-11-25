import { Inject, Injectable } from '@nestjs/common';

import {
  PPPOE_OPERACION_QUERY,
  PppoeOperacionQueryPort,
} from '../../domain/ports/pppoe-operacion-query.port';

import { PppoeOperacionDetalle } from '../../domain/read-models/pppoe-operacion.read-model';
import {
  OperacionPppoeDatosInvalidosError,
  OperacionPppoeNoEncontradaError,
} from '../../domain/errors/pppoe-operacion.errors';

/**
 * Datos necesarios para consultar una operación.
 */
export type ObtenerDetallePppoeOperacionUseCaseInput = {
  operacionId: number;
};

/**
 * Obtiene el detalle enriquecido de una operación PPPoE.
 */
@Injectable()
export class ObtenerDetallePppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_QUERY)
    private readonly query: PppoeOperacionQueryPort,
  ) {}

  async execute(
    input: ObtenerDetallePppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionDetalle> {
    this.validateInput(input);

    const detalle = await this.query.findDetailById({
      operacionId: input.operacionId,
    });

    if (!detalle) {
      throw new OperacionPppoeNoEncontradaError();
    }

    return detalle;
  }

  private validateInput(input: ObtenerDetallePppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.operacionId, 'operacionId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new OperacionPppoeDatosInvalidosError(
        `${field} debe ser un entero positivo.`,
      );
    }
  }
}
