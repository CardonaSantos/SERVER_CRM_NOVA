import { DomainError } from 'src/common/hexagonal/domain-error';

export class AccesoInternetNoEncontradoError extends DomainError {
  readonly codigo = 'ACCESO_INTERNET_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('No se encontró el acceso de internet.');
  }
}

export class AccesoInternetDatosInvalidosError extends DomainError {
  readonly codigo = 'ACCESO_INTERNET_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class AccesoInternetEstadoInvalidoError extends DomainError {
  readonly codigo = 'ACCESO_INTERNET_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class AccesoInternetDadoDeBajaError extends DomainError {
  readonly codigo = 'ACCESO_INTERNET_DADO_DE_BAJA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('No se puede modificar un acceso que está dado de baja.');
  }
}
