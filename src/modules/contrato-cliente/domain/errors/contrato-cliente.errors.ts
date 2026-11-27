import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

export class ContratoDatosInvalidosError extends DomainError {
  readonly codigo = 'CONTRATO_DATOS_INVALIDOS';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ContratoClienteNoEncontradoError extends DomainError {
  readonly codigo = 'CONTRATO_CLIENTE_NO_ENCONTRADO';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('El cliente no existe o fue eliminado.');
  }
}

export class ContratoClienteYaExisteError extends DomainError {
  readonly codigo = 'CONTRATO_CLIENTE_YA_EXISTE';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super('El cliente ya tiene un contrato.');
  }
}

export class ContratoNumeroDuplicadoError extends DomainError {
  // Código publicado antes por `cliente`: no se renombra.
  readonly codigo = 'CLIENTE_CONTRATO_DUPLICADO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super(
      'Ese número de contrato ya está registrado en otro cliente (puede ser uno eliminado).',
    );
  }
}

export class PlantillaContratoNoEncontradaError extends DomainError {
  readonly codigo = 'CONTRATO_PLANTILLA_NO_ENCONTRADA';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('La plantilla de contrato no existe.');
  }
}

export class ContratoInstalacionNoEncontradaError extends DomainError {
  readonly codigo = 'CONTRATO_INSTALACION_NO_ENCONTRADA';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('La instalación no existe.');
  }
}
