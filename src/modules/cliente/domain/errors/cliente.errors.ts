import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

export class ClienteDatosInvalidosError extends DomainError {
  readonly codigo = 'CLIENTE_DATOS_INVALIDOS';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ClienteNoEncontradoError extends DomainError {
  readonly codigo = 'CLIENTE_NO_ENCONTRADO';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('Cliente no encontrado.');
  }
}

export class ClienteEliminadoError extends DomainError {
  readonly codigo = 'CLIENTE_ELIMINADO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super('El cliente está eliminado.');
  }
}

export class ClienteConAccesoVigenteError extends DomainError {
  readonly codigo = 'CLIENTE_CON_ACCESO_VIGENTE';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super(
      'El cliente todavía tiene servicio de internet activo. Desinstálalo antes de eliminarlo.',
    );
  }
}

export class ClienteReferenciaInvalidaError extends DomainError {
  readonly codigo = 'CLIENTE_REFERENCIA_INVALIDA';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor() {
    super(
      'Alguno de los datos seleccionados (zona, plan, sector, servicio, asesor, municipio o router) ya no existe.',
    );
  }
}

export class ClienteContratoDuplicadoError extends DomainError {
  readonly codigo = 'CLIENTE_CONTRATO_DUPLICADO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super(
      'Ese número de contrato ya está registrado en otro cliente (puede ser uno eliminado).',
    );
  }
}

export class ClienteModificadoError extends DomainError {
  readonly codigo = 'CLIENTE_MODIFICADO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super('El cliente cambió mientras se guardaba. Vuelve a intentarlo.');
  }
}
