import {
  DomainError,
  TipoErrorDominio,
} from 'src/common/hexagonal/domain-error';

export class TicketSoporteHistorialDatosInvalidosError extends DomainError {
  readonly codigo = 'TICKET_HISTORIAL_DATOS_INVALIDOS';
  readonly tipo: TipoErrorDominio = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketSoporteHistorialNoEncontradoError extends DomainError {
  readonly codigo = 'TICKET_HISTORIAL_NO_ENCONTRADO';
  readonly tipo: TipoErrorDominio = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró el registro del historial.');
  }
}
