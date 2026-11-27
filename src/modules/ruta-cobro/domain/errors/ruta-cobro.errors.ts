import { DomainError } from 'src/common/hexagonal/domain-error';

export class RutaCobroNoEncontradaError extends DomainError {
  readonly codigo = 'RUTA_COBRO_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Ruta de cobro no encontrada.');
  }
}

export class RutaCobroInvalidaError extends DomainError {
  readonly codigo = 'RUTA_COBRO_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class RutaCobroEliminadaError extends DomainError {
  readonly codigo = 'RUTA_COBRO_ELIMINADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La ruta de cobro está eliminada.');
  }
}

export class RutaCobroCerradaError extends DomainError {
  readonly codigo = 'RUTA_COBRO_CERRADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La ruta de cobro está cerrada.');
  }
}

export class RutaCobroClienteAjenoError extends DomainError {
  readonly codigo = 'RUTA_COBRO_CLIENTE_AJENO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El cliente no pertenece a esta ruta de cobro.');
  }
}

export class RutaCobroCobradorInvalidoError extends DomainError {
  readonly codigo = 'RUTA_COBRO_COBRADOR_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('El cobrador seleccionado no existe o está inactivo.');
  }
}

export class RutaCobroClientesInvalidosError extends DomainError {
  readonly codigo = 'RUTA_COBRO_CLIENTES_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('Algunos clientes seleccionados no existen o están eliminados.');
  }
}
