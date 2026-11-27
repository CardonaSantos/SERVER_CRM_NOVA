import { DomainError } from 'src/common/hexagonal/domain-error';

export class NotificacionInvalidaError extends DomainError {
  readonly codigo = 'NOTIFICACION_INVALIDA';
  readonly tipo = 'INVALIDO';

  constructor(mensaje = 'Los datos de la notificación no son válidos.') {
    super(mensaje);
  }
}

export class NotificacionNoEncontradaError extends DomainError {
  readonly codigo = 'NOTIFICACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('No se encontró la notificación.');
  }
}

export class DispositivoPushInvalidoError extends DomainError {
  readonly codigo = 'DISPOSITIVO_PUSH_INVALIDO';
  readonly tipo = 'INVALIDO';

  constructor(mensaje = 'Los datos del dispositivo no son válidos.') {
    super(mensaje);
  }
}
