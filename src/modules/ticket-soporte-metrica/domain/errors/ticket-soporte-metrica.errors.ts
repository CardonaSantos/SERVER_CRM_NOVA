import { DomainError } from 'src/common/hexagonal/domain-error';

export class MetaTicketNoEncontradaError extends DomainError {
  readonly codigo = 'META_TICKET_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Meta no encontrada.');
  }
}

export class MetaTicketInvalidaError extends DomainError {
  readonly codigo = 'META_TICKET_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class MetaTicketTecnicoNoDisponibleError extends DomainError {
  readonly codigo = 'META_TICKET_TECNICO_NO_DISPONIBLE';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('El técnico no existe o está inactivo.');
  }
}

export class MetaTicketSolapadaError extends DomainError {
  readonly codigo = 'META_TICKET_SOLAPADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El técnico ya tiene una meta en esas fechas.');
  }
}

export class MetaTicketCanceladaError extends DomainError {
  readonly codigo = 'META_TICKET_CANCELADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La meta está cancelada.');
  }
}
