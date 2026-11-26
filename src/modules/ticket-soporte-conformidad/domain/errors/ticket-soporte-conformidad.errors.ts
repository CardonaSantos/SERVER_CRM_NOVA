import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

/** Un dato no cumple una regla del concepto (ids, fechas, textos obligatorios). */
export class TicketConformidadDatosInvalidosError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_DATOS_INVALIDOS';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketFirmaRequeridaError extends DomainError {
  readonly codigo = 'TICKET_FIRMA_REQUERIDA';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor() {
    super('La firma es requerida.');
  }
}

export class TicketConformidadTicketNoEncontradoError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_TICKET_NO_ENCONTRADO';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró el ticket de soporte.');
  }
}

export class TicketConformidadNoEncontradaError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_NO_ENCONTRADA';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró la conformidad.');
  }
}

export class TicketSinConformidadError extends DomainError {
  readonly codigo = 'TICKET_SIN_CONFORMIDAD';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('El ticket no posee solicitudes de conformidad.');
  }
}

/** La conformidad no está en un estado que permita la operación pedida. */
export class TicketConformidadEstadoInvalidoError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_ESTADO_INVALIDO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketConformidadPendienteExistenteError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_PENDIENTE_EXISTENTE';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super('El ticket ya posee una solicitud de conformidad pendiente.');
  }
}

/** Al ticket o a la conformidad le falta un dato sin el cual no se puede seguir. */
export class TicketConformidadContextoIncompletoError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_CONTEXTO_INCOMPLETO';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketFirmaDuplicadaError extends DomainError {
  readonly codigo = 'TICKET_FIRMA_DUPLICADA';
  readonly tipo: TipoErrorDominio = 'CONFLICTO';

  constructor() {
    super('La conformidad ya posee una firma técnica.');
  }
}

export class TicketConformidadProhibidaError extends DomainError {
  readonly codigo = 'TICKET_CONFORMIDAD_PROHIBIDA';
  readonly tipo: TipoErrorDominio = 'PROHIBIDO';

  constructor() {
    super('La conformidad no pertenece al técnico autenticado.');
  }
}
