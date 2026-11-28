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

export class EtapaJornadaInvalidaError extends DomainError {
  readonly codigo = 'TAREA_PROGRAMADA_ETAPA_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TareaProgramadaEnCursoError extends DomainError {
  readonly codigo = 'TAREA_PROGRAMADA_EN_CURSO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'La tarea, o la jornada del día, se está ejecutando. Intente más tarde.',
    );
  }
}

export class TareaProgramadaNoManualError extends DomainError {
  readonly codigo = 'TAREA_PROGRAMADA_NO_MANUAL';
  readonly tipo = 'PROHIBIDO';
  constructor() {
    super('Esa tarea no se puede ejecutar a mano.');
  }
}
