import { Inject, Injectable } from '@nestjs/common';

import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionAggregate,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';

export type BuscarAgregadoPppoeOperacionUseCaseInput = {
  empresaId: number;
  operacionId: number;
};

/** La operación con sus pasos, o null si no existe. */
@Injectable()
export class BuscarAgregadoPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  execute(
    input: BuscarAgregadoPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionAggregate | null> {
    return this.repository.findAggregateById(input);
  }
}
