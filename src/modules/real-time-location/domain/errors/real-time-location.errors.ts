import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

/** Un dato no cumple una regla del concepto (ids, fechas, coordenadas, rangos). */
export class TrackingDatosInvalidosError extends DomainError {
  readonly codigo = 'TRACKING_DATOS_INVALIDOS';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TrackingSesionNoEncontradaError extends DomainError {
  readonly codigo = 'TRACKING_SESION_NO_ENCONTRADA';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró la sesión de tracking.');
  }
}

export class TrackingAsistenciaNoEncontradaError extends DomainError {
  readonly codigo = 'TRACKING_ASISTENCIA_NO_ENCONTRADA';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró la asistencia solicitada.');
  }
}

/** La sesión no está en un estado que permita la operación (cerrada, expirada, perdida por concurrencia). */
export class TrackingSesionEstadoInvalidoError extends DomainError {
  readonly codigo = 'TRACKING_SESION_ESTADO_INVALIDO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** Los datos guardados de una sesión están incompletos (sin asistencia, sin id…). */
export class TrackingSesionInconsistenteError extends DomainError {
  readonly codigo = 'TRACKING_SESION_INCONSISTENTE';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}
