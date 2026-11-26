import { DomainError } from 'src/common/hexagonal/domain-error';

export class ClienteDesinstalacionNoEncontradaError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('Desinstalación no encontrada.');
  }
}

/** Un dato no cumple una regla del concepto (id, fecha, monto, coordenadas…). */
export class ClienteDesinstalacionDatosInvalidosError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** La desinstalación no está en un estado que permita la operación pedida. */
export class ClienteDesinstalacionEstadoInvalidoError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class AutorizacionDesinstalacionNoEncontradaError extends DomainError {
  readonly codigo = 'AUTORIZACION_DESINSTALACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('Autorización de desinstalación no encontrada.');
  }
}

/** La autorización no admite la operación (ya respondida, pendiente, sin aprobar…). */
export class AutorizacionDesinstalacionConflictoError extends DomainError {
  readonly codigo = 'AUTORIZACION_DESINSTALACION_CONFLICTO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** El acceso o el ticket indicados no sirven para esta desinstalación. */
export class ClienteDesinstalacionAccesoInvalidoError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_ACCESO_INVALIDO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ClienteDesinstalacionAccesoNoEncontradoError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_ACCESO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('No existe el acceso indicado para este cliente.');
  }
}

export class TecnicoDesinstalacionNoEncontradoError extends DomainError {
  readonly codigo = 'TECNICO_DESINSTALACION_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('Técnico de la desinstalación no encontrado.');
  }
}

export class TecnicoDesinstalacionConflictoError extends DomainError {
  readonly codigo = 'TECNICO_DESINSTALACION_CONFLICTO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** La baja PPPoE de la aprobación no puede ejecutarse o no terminó como se esperaba. */
export class ClienteDesinstalacionPppoeConflictoError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_PPPOE_CONFLICTO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class EvidenciaDesinstalacionRequeridaError extends DomainError {
  readonly codigo = 'EVIDENCIA_DESINSTALACION_REQUERIDA';
  readonly tipo = 'INVALIDO';

  constructor() {
    super('Debe adjuntar el archivo de la evidencia.');
  }
}

export class ClienteDesinstalacionClienteNoEncontradoError extends DomainError {
  readonly codigo = 'CLIENTE_DESINSTALACION_CLIENTE_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('Cliente no encontrado.');
  }
}
