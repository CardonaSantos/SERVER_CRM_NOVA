import { DomainError } from 'src/common/hexagonal/domain-error';

export class TicketNoEncontradoError extends DomainError {
  readonly codigo = 'TICKET_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('El ticket no existe.');
  }
}

export class TicketNoAsignadoError extends DomainError {
  readonly codigo = 'TICKET_NO_ASIGNADO';
  readonly tipo = 'PROHIBIDO';
  constructor() {
    super('Este ticket no está asignado a ti.');
  }
}

export class TicketInvalidoError extends DomainError {
  readonly codigo = 'TICKET_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketAccionNoPermitidaError extends DomainError {
  readonly codigo = 'TICKET_ACCION_NO_PERMITIDA';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class TicketAccionDeOficinaError extends DomainError {
  readonly codigo = 'TICKET_ACCION_DE_OFICINA';
  readonly tipo = 'PROHIBIDO';
  constructor(mensaje = 'Solo la oficina puede hacer este cambio.') {
    super(mensaje);
  }
}

export class TicketSinTecnicoError extends DomainError {
  readonly codigo = 'TICKET_SIN_TECNICO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje = 'Asigna un técnico antes de iniciar la atención.') {
    super(mensaje);
  }
}

export class TicketClienteNoEncontradoError extends DomainError {
  readonly codigo = 'TICKET_CLIENTE_NO_ENCONTRADO';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('El cliente seleccionado no existe.');
  }
}

export class TicketTecnicoNoValidoError extends DomainError {
  readonly codigo = 'TICKET_TECNICO_NO_VALIDO';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('Uno de los usuarios asignados no existe o está inactivo.');
  }
}

export class TicketEtiquetaNoDisponibleError extends DomainError {
  readonly codigo = 'TICKET_ETIQUETA_NO_DISPONIBLE';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('Una de las etiquetas seleccionadas no está disponible.');
  }
}

export class TicketSolucionNoDisponibleError extends DomainError {
  readonly codigo = 'TICKET_SOLUCION_NO_DISPONIBLE';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('La solución seleccionada no está disponible.');
  }
}

export class TicketRangoFechasInvalidoError extends DomainError {
  readonly codigo = 'TICKET_RANGO_FECHAS_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('La fecha final no puede ser anterior a la inicial.');
  }
}

export class ComentarioInvalidoError extends DomainError {
  readonly codigo = 'COMENTARIO_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ComentarioImagenInvalidaError extends DomainError {
  readonly codigo = 'COMENTARIO_IMAGEN_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ComentarioNoEncontradoError extends DomainError {
  readonly codigo = 'COMENTARIO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('El comentario no existe o ya fue eliminado.');
  }
}

export class ComentarioAjenoError extends DomainError {
  readonly codigo = 'COMENTARIO_AJENO';
  readonly tipo = 'PROHIBIDO';
  constructor(mensaje = 'Solo puedes eliminar tus propios comentarios.') {
    super(mensaje);
  }
}

export class ComentarioImagenNoEncontradaError extends DomainError {
  readonly codigo = 'COMENTARIO_IMAGEN_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('La imagen no existe o ya fue eliminada.');
  }
}

export class EtiquetaTicketNoEncontradaError extends DomainError {
  readonly codigo = 'ETIQUETA_TICKET_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('La etiqueta no existe.');
  }
}

export class EtiquetaTicketNombreDuplicadoError extends DomainError {
  readonly codigo = 'ETIQUETA_TICKET_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje = 'Ya existe una etiqueta con ese nombre.') {
    super(mensaje);
  }
}

export class SolucionTicketNoEncontradaError extends DomainError {
  readonly codigo = 'SOLUCION_TICKET_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('La solución no existe.');
  }
}

export class SolucionTicketNombreDuplicadoError extends DomainError {
  readonly codigo = 'SOLUCION_TICKET_NOMBRE_DUPLICADO';
  readonly tipo = 'CONFLICTO';
  constructor(mensaje = 'Ya existe una solución con ese nombre.') {
    super(mensaje);
  }
}

export class CatalogoTicketInvalidoError extends DomainError {
  readonly codigo = 'CATALOGO_TICKET_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}
