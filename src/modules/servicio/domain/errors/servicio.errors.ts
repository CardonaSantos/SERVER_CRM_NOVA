import { DomainError } from 'src/common/hexagonal/domain-error';

export type UsoPlanInternetDescrito = {
  clientes: number;
  accesos: number;
  instalaciones: number;
  desinstalaciones: number;
  homologaciones: number;
};

export class PlanInternetNoEncontradoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Plan de internet no encontrado.');
  }
}

export class PlanInternetInvalidoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class PlanInternetEliminadoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_ELIMINADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El plan de internet está eliminado.');
  }
}

export class PlanInternetInactivoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_INACTIVO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El plan de internet está inactivo y no admite asignaciones nuevas.');
  }
}

export class PlanInternetEnUsoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor(uso: UsoPlanInternetDescrito) {
    super(
      `No se puede eliminar el plan: tiene ${uso.clientes} cliente(s), ${uso.accesos} acceso(s) de internet, ${uso.instalaciones} instalación(es), ${uso.desinstalaciones} desinstalación(es) y ${uso.homologaciones} homologación(es) PPPoE. Desactívelo para dejar de ofrecerlo.`,
    );
  }
}

export class PlanInternetNombreDuplicadoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya existe un plan de internet con ese nombre.');
  }
}

export class PlanInternetModificadoError extends DomainError {
  readonly codigo = 'PLAN_INTERNET_MODIFICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'El plan de internet cambió mientras se guardaba. Vuelva a intentarlo.',
    );
  }
}

export class ServicioAdicionalNoEncontradoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Servicio adicional no encontrado.');
  }
}

export class ServicioAdicionalInvalidoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ServicioAdicionalEliminadoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_ELIMINADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('El servicio adicional está eliminado.');
  }
}

export class ServicioAdicionalInactivoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_INACTIVO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'El servicio adicional está inactivo y no admite asignaciones nuevas.',
    );
  }
}

export class ServicioAdicionalEnUsoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor(uso: { clientes: number; facturas: number }) {
    super(
      `No se puede eliminar el servicio: tiene ${uso.clientes} asignación(es) a clientes y ${uso.facturas} línea(s) de factura. Desactívelo para dejar de ofrecerlo.`,
    );
  }
}

export class ServicioAdicionalNombreDuplicadoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya existe un servicio adicional con ese nombre.');
  }
}

export class ServicioAdicionalModificadoError extends DomainError {
  readonly codigo = 'SERVICIO_ADICIONAL_MODIFICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'El servicio adicional cambió mientras se guardaba. Vuelva a intentarlo.',
    );
  }
}

export class TipoServicioNoEncontradoError extends DomainError {
  readonly codigo = 'TIPO_SERVICIO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Tipo de servicio no encontrado.');
  }
}

export class TipoServicioInvalidoError extends DomainError {
  readonly codigo = 'TIPO_SERVICIO_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TipoServicioNombreDuplicadoError extends DomainError {
  readonly codigo = 'TIPO_SERVICIO_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('Ya existe un tipo de servicio con ese nombre.');
  }
}
