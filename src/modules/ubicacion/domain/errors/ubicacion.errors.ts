import { DomainError } from 'src/common/hexagonal/domain-error';

export class DepartamentoNoEncontradoError extends DomainError {
  readonly codigo = 'DEPARTAMENTO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Departamento no encontrado.');
  }
}

export class MunicipioNoEncontradoError extends DomainError {
  readonly codigo = 'MUNICIPIO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Municipio no encontrado.');
  }
}

export class MunicipioDeOtroDepartamentoError extends DomainError {
  readonly codigo = 'MUNICIPIO_DE_OTRO_DEPARTAMENTO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El municipio no pertenece al departamento seleccionado.');
  }
}

export class SectorNoEncontradoError extends DomainError {
  readonly codigo = 'SECTOR_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Sector no encontrado.');
  }
}

export class SectorInvalidoError extends DomainError {
  readonly codigo = 'SECTOR_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class SectorEliminadoError extends DomainError {
  readonly codigo = 'SECTOR_ELIMINADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El sector está eliminado.');
  }
}

export class SectorDeOtroMunicipioError extends DomainError {
  readonly codigo = 'SECTOR_DE_OTRO_MUNICIPIO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El sector no pertenece al municipio seleccionado.');
  }
}

export class SectorEnUsoError extends DomainError {
  readonly codigo = 'SECTOR_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor(clientes: number) {
    super(
      `No se puede eliminar el sector: tiene ${clientes} cliente(s), contando los eliminados.`,
    );
  }
}

export class SectorConClientesError extends DomainError {
  readonly codigo = 'SECTOR_CON_CLIENTES';
  readonly tipo = 'CONFLICTO';
  constructor(clientes: number) {
    super(
      `No se puede cambiar el municipio del sector: tiene ${clientes} cliente(s), contando los eliminados.`,
    );
  }
}

export class SectorNombreDuplicadoError extends DomainError {
  readonly codigo = 'SECTOR_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya existe un sector con ese nombre en el municipio.');
  }
}

export class SectorModificadoError extends DomainError {
  readonly codigo = 'SECTOR_MODIFICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El sector cambió mientras se guardaba. Vuelva a intentarlo.');
  }
}
