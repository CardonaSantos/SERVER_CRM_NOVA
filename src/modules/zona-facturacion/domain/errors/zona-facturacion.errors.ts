import { DomainError } from 'src/common/hexagonal/domain-error';

export class ZonaFacturacionNoEncontradaError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Zona de facturación no encontrada.');
  }
}

export class ZonaFacturacionInvalidaError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class ZonaFacturacionEliminadaError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_ELIMINADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La zona de facturación está eliminada.');
  }
}

export class ZonaFacturacionEnUsoError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_EN_USO';
  readonly tipo = 'CONFLICTO';
  constructor(uso: { clientes: number; facturas: number }) {
    super(
      `No se puede eliminar la zona: tiene ${uso.clientes} cliente(s) y ${uso.facturas} factura(s) asociados.`,
    );
  }
}

export class ZonaFacturacionModificadaError extends DomainError {
  readonly codigo = 'ZONA_FACTURACION_MODIFICADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'La zona de facturación cambió mientras se guardaba. Vuelva a intentarlo.',
    );
  }
}
