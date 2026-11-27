import { DomainError } from 'src/common/hexagonal/domain-error';

export class MensajeriaPlantillaInvalidaError extends DomainError {
  readonly codigo = 'MENSAJERIA_PLANTILLA_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje = 'Los datos de la plantilla no son válidos.') {
    super(mensaje);
  }
}

export class MensajeriaPlantillaNoEncontradaError extends DomainError {
  readonly codigo = 'MENSAJERIA_PLANTILLA_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('La plantilla no existe en WhatsApp con ese nombre e idioma.');
  }
}

export class MensajeriaPlantillaNoEnviableError extends DomainError {
  readonly codigo = 'MENSAJERIA_PLANTILLA_NO_ENVIABLE';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class MensajeriaArchivoInvalidoError extends DomainError {
  readonly codigo = 'MENSAJERIA_ARCHIVO_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('Envía una imagen JPG o PNG de hasta 5 MB en el campo file.');
  }
}

/** WhatsApp respondió y rechazó la solicitud: no se envió nada. */
export class MensajeriaProveedorRechazoError extends DomainError {
  readonly codigo = 'MENSAJERIA_PROVEEDOR_RECHAZO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje = 'WhatsApp rechazó la solicitud.') {
    super(mensaje);
  }
}

/** No se pudo usar WhatsApp: es seguro que no se envió nada. */
export class MensajeriaProveedorNoDisponibleError extends DomainError {
  readonly codigo = 'MENSAJERIA_PROVEEDOR_NO_DISPONIBLE';
  readonly tipo = 'EXTERNO';
  constructor() {
    super('No se pudo usar WhatsApp en este momento. Intenta más tarde.');
  }
}

/** La petición salió pero no hubo respuesta clara. */
export class MensajeriaSinConfirmacionError extends DomainError {
  readonly codigo = 'MENSAJERIA_SIN_CONFIRMACION';
  readonly tipo = 'EXTERNO';
  constructor() {
    super('WhatsApp no confirmó la operación. Revisa antes de repetirla.');
  }
}

export class CampaniaNoEncontradaError extends DomainError {
  readonly codigo = 'CAMPANIA_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Campaña no encontrada.');
  }
}

export class CampaniaEnCursoError extends DomainError {
  readonly codigo = 'CAMPANIA_EN_CURSO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya hay una campaña enviándose. Espera a que termine.');
  }
}

export class CampaniaNoReanudableError extends DomainError {
  readonly codigo = 'CAMPANIA_NO_REANUDABLE';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Solo se puede reanudar una campaña interrumpida.');
  }
}

export class CampaniaClienteNoEncontradoError extends DomainError {
  readonly codigo = 'CAMPANIA_CLIENTE_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Alguno de los clientes seleccionados ya no existe.');
  }
}

export class CampaniaSinDestinatariosError extends DomainError {
  readonly codigo = 'CAMPANIA_SIN_DESTINATARIOS';
  readonly tipo = 'INVALIDO';
  constructor() {
    super(
      'Ningún cliente seleccionado puede recibir el mensaje: revisa sus teléfonos y si tienen WhatsApp activo.',
    );
  }
}
