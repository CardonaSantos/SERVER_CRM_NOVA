import { DomainError } from 'src/common/hexagonal/domain-error';

export class EjecucionTareaInvalidaError extends DomainError {
  readonly codigo = 'TAREA_PROGRAMADA_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class EjecucionTareaEstadoInvalidoError extends DomainError {
  readonly codigo = 'TAREA_PROGRAMADA_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La tarea programada no está en un estado que permita esa acción.');
  }
}
