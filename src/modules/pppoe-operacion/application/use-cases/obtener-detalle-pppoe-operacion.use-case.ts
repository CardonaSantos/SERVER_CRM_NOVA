import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  PPPOE_OPERACION_QUERY,
  PppoeOperacionQueryPort,
} from '../../domain/ports/pppoe-operacion-query.port';

import { PppoeOperacionDetalle } from '../../domain/read-models/pppoe-operacion.read-model';

/**
 * Datos necesarios para consultar una operación.
 */
export type ObtenerDetallePppoeOperacionUseCaseInput = {
  empresaId: number;

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
      empresaId: input.empresaId,

      operacionId: input.operacionId,
    });

    if (!detalle) {
      throw new NotFoundException(
        `No existe la operación PPPoE ${input.operacionId} en la empresa ${input.empresaId}.`,
      );
    }

    return detalle;
  }

  private validateInput(input: ObtenerDetallePppoeOperacionUseCaseInput): void {
    this.assertPositiveInteger(input.empresaId, 'empresaId');

    this.assertPositiveInteger(input.operacionId, 'operacionId');
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
