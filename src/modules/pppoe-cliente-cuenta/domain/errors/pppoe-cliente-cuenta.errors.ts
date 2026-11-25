import { DomainError } from 'src/common/hexagonal/domain-error';

export class CuentaPppoeNoEncontradaError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró la cuenta PPPoE.');
  }
}

export class CuentaPppoeEstadoInvalidoError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class CuentaPppoeEliminadaError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_ELIMINADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('No se puede modificar una cuenta PPPoE eliminada.');
  }
}

export class CuentaPppoeDatosInvalidosError extends DomainError {
  readonly codigo = 'CUENTA_PPPOE_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}
