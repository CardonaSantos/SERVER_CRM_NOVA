import { DomainError } from 'src/common/hexagonal/domain-error';

export class FechaAuditoriaInvalidaError extends DomainError {
  readonly codigo = 'FECHA_INVALIDA';
  readonly tipo = 'INVALIDO' as const;

  constructor(campo: 'fechaDesde' | 'fechaHasta') {
    super(`${campo} no contiene una fecha válida.`);
  }
}

export class RangoFechasAuditoriaInvalidoError extends DomainError {
  readonly codigo = 'RANGO_FECHAS_INVALIDO';
  readonly tipo = 'INVALIDO' as const;

  constructor() {
    super('fechaDesde no puede ser posterior a fechaHasta.');
  }
}

export class InstalacionAuditoriaNoEncontradaError extends DomainError {
  readonly codigo = 'INSTALACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO' as const;

  constructor() {
    super('No se encontró la instalación.');
  }
}
