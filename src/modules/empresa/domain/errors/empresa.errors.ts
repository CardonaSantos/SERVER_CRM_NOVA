import { DomainError } from 'src/common/hexagonal/domain-error';

export class EmpresaNoConfiguradaError extends DomainError {
  readonly codigo = 'EMPRESA_NO_CONFIGURADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('La empresa no está configurada.');
  }
}

export class EmpresaDatosInvalidosError extends DomainError {
  readonly codigo = 'EMPRESA_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class EmpresaNombreEnUsoError extends DomainError {
  readonly codigo = 'EMPRESA_NOMBRE_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ese nombre ya está en uso.');
  }
}
