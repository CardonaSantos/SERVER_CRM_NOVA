import { DomainError } from 'src/common/hexagonal/domain-error';

export class OperacionPppoeNoEncontradaError extends DomainError {
  readonly codigo = 'OPERACION_PPPOE_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró la operación PPPoE.');
  }
}

export class PasoOperacionPppoeNoEncontradoError extends DomainError {
  readonly codigo = 'PASO_OPERACION_PPPOE_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró el paso de la operación PPPoE.');
  }
}

/** La operación o sus pasos no están en el estado que la acción exige. */
export class OperacionPppoeEstadoInvalidoError extends DomainError {
  readonly codigo = 'OPERACION_PPPOE_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** Ya hay una operación ejecutándose para la cuenta, u otro proceso la tomó. */
export class OperacionPppoeEnCursoError extends DomainError {
  readonly codigo = 'OPERACION_PPPOE_EN_CURSO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class OperacionPppoeIdempotenciaError extends DomainError {
  readonly codigo = 'OPERACION_PPPOE_IDEMPOTENCIA';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class OperacionPppoeDatosInvalidosError extends DomainError {
  readonly codigo = 'OPERACION_PPPOE_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** Contraseña del operador incorrecta al autorizar. 403 y no 401: la sesión sigue válida. */
export class ReautenticacionOperadorInvalidaError extends DomainError {
  readonly codigo = 'REAUTENTICACION_INVALIDA';
  readonly tipo = 'PROHIBIDO';
  constructor() {
    super('No fue posible validar las credenciales del operador.');
  }
}
