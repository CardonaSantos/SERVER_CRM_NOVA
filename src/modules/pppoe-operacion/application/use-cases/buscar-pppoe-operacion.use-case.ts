import { Inject, Injectable } from '@nestjs/common';

import { PppoeOperacionEntity } from '../../domain/entities/pppoe-operacion.entity';
import {
  PPPOE_OPERACION_REPOSITORY,
  PppoeOperacionRepositoryPort,
} from '../../domain/ports/pppoe-operacion-repository.port';

export type BuscarPppoeOperacionUseCaseInput =
  | { por: 'ID'; operacionId: number }
  | { por: 'CLAVE_IDEMPOTENCIA'; claveIdempotencia: string }
  /** El intento más reciente de la cadena que nace en `operacionRaizId`. */
  | { por: 'ULTIMO_INTENTO'; operacionRaizId: number };

/** Búsquedas de una operación que devuelven null si no existe. */
@Injectable()
export class BuscarPppoeOperacionUseCase {
  constructor(
    @Inject(PPPOE_OPERACION_REPOSITORY)
    private readonly repository: PppoeOperacionRepositoryPort,
  ) {}

  execute(
    input: BuscarPppoeOperacionUseCaseInput,
  ): Promise<PppoeOperacionEntity | null> {
    switch (input.por) {
      case 'ID':
        return this.repository.findById(input);
      case 'CLAVE_IDEMPOTENCIA':
        return this.repository.findByIdempotencyKey(input);
      case 'ULTIMO_INTENTO':
        return this.repository.findLatestAttempt(input);
      default: {
        const exhaustivo: never = input;
        throw new Error(`Búsqueda no soportada: ${String(exhaustivo)}.`);
      }
    }
  }
}
