import { DomainError } from 'src/common/hexagonal/domain-error';

export class CuentaPppoeNoEncontradaError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró la cuenta PPPoE.');
  }
}
