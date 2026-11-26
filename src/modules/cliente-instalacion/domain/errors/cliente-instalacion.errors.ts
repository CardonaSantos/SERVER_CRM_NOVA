import { DomainError } from 'src/common/hexagonal/domain-error';

export class ClienteInstalacionNoEncontradaError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';

  constructor() {
    super('Instalación no encontrada.');
  }
}

/** Un dato no cumple una regla del concepto (id, fecha, monto, coordenadas…). */
export class ClienteInstalacionDatosInvalidosError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_DATOS_INVALIDOS';
  readonly tipo = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** La instalación no está en un estado que permita la operación pedida. */
export class ClienteInstalacionEstadoInvalidoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_ESTADO_INVALIDO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ClienteInstalacionAccesoNoEncontradoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_ACCESO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';

  constructor(
    mensaje = 'El acceso indicado no existe o no pertenece al cliente.',
  ) {
    super(mensaje);
  }
}

export class ClienteInstalacionAccesoDuplicadoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_ACCESO_DUPLICADO';
  readonly tipo = 'CONFLICTO';

  constructor() {
    super('El acceso ya se encuentra vinculado a esta instalación.');
  }
}

export class ClienteInstalacionTecnicoInvalidoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_TECNICO_INVALIDO';
  readonly tipo = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** Quien opera no puede hacerlo sobre esta instalación (rol o asignación). */
export class ClienteInstalacionProhibidaError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_PROHIBIDA';
  readonly tipo = 'PROHIBIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class EvidenciaInstalacionRequeridaError extends DomainError {
  readonly codigo = 'EVIDENCIA_INSTALACION_REQUERIDA';
  readonly tipo = 'INVALIDO';

  constructor() {
    super('Debe adjuntar el archivo de la evidencia.');
  }
}

/** El acceso de internet que se quiere crear o vincular no es válido. */
export class ClienteInstalacionAccesoInvalidoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_ACCESO_INVALIDO';
  readonly tipo = 'INVALIDO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}

/** El acceso o la cuenta PPPoE de la instalación no permiten la operación pedida. */
export class ClienteInstalacionPppoeConflictoError extends DomainError {
  readonly codigo = 'CLIENTE_INSTALACION_PPPOE_CONFLICTO';
  readonly tipo = 'CONFLICTO';

  constructor(mensaje: string) {
    super(mensaje);
  }
}
