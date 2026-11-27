import { DomainError } from 'src/common/hexagonal/domain-error';

export class FacturaNoEncontradaError extends DomainError {
  readonly codigo = 'FACTURA_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Factura no encontrada.');
  }
}

export class FacturaInvalidaError extends DomainError {
  readonly codigo = 'FACTURA_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class FacturaDeOtroClienteError extends DomainError {
  readonly codigo = 'FACTURA_DE_OTRO_CLIENTE';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La factura no pertenece a ese cliente.');
  }
}

export class FacturaAnuladaError extends DomainError {
  readonly codigo = 'FACTURA_ANULADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La factura está anulada. Reactívela para modificarla o cobrarla.');
  }
}

export class FacturaSinDeudaError extends DomainError {
  readonly codigo = 'FACTURA_SIN_DEUDA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La factura ya está pagada: no tiene saldo pendiente.');
  }
}

export class FacturaConPagosError extends DomainError {
  readonly codigo = 'FACTURA_CON_PAGOS';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La factura tiene pagos registrados. Elimine primero sus pagos.');
  }
}

export class FacturaMontoMenorQuePagadoError extends DomainError {
  readonly codigo = 'FACTURA_MONTO_MENOR_QUE_PAGADO';
  readonly tipo = 'CONFLICTO';
  constructor(pagado: number) {
    super(
      `El monto no puede ser menor que lo ya pagado (Q${pagado.toFixed(2)}).`,
    );
  }
}

export class FacturaDuplicadaError extends DomainError {
  readonly codigo = 'FACTURA_DUPLICADA';
  readonly tipo = 'CONFLICTO';
  constructor(periodos: string[] = []) {
    super(
      periodos.length > 0
        ? `Ya existen facturas para los periodos: ${periodos.join(', ')}.`
        : 'Ya existe una factura para ese mes. No se permiten duplicados.',
    );
  }
}

export class FacturaModificadaError extends DomainError {
  readonly codigo = 'FACTURA_MODIFICADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super('La factura cambió mientras se guardaba. Vuelva a intentarlo.');
  }
}

export class PagoNoEncontradoError extends DomainError {
  readonly codigo = 'PAGO_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Pago no encontrado.');
  }
}

export class PagoInvalidoError extends DomainError {
  readonly codigo = 'PAGO_INVALIDO';
  readonly tipo = 'INVALIDO';
  constructor(mensaje: string) {
    super(mensaje);
  }
}

export class PagoExcedeSaldoError extends DomainError {
  readonly codigo = 'PAGO_EXCEDE_SALDO';
  readonly tipo = 'CONFLICTO';
  constructor(saldo: number) {
    super(
      `El monto supera el saldo pendiente de la factura (Q${saldo.toFixed(2)}).`,
    );
  }
}

export class PagoBoletaRequeridaError extends DomainError {
  readonly codigo = 'PAGO_BOLETA_REQUERIDA';
  readonly tipo = 'INVALIDO';
  constructor() {
    super(
      'Ingrese el número de boleta o de transferencia para un pago por depósito.',
    );
  }
}

export class PagoBoletaDuplicadaError extends DomainError {
  readonly codigo = 'PAGO_BOLETA_DUPLICADA';
  readonly tipo = 'CONFLICTO';
  constructor() {
    super(
      'Ese número de boleta o transferencia ya está registrado en otro pago.',
    );
  }
}

export class ClienteNoFacturableError extends DomainError {
  readonly codigo = 'CLIENTE_NO_FACTURABLE';
  readonly tipo = 'CONFLICTO';
  constructor(motivo: string) {
    super(motivo);
  }
}

export class FacturacionClienteNoEncontradoError extends DomainError {
  readonly codigo = 'FACTURACION_CLIENTE_NO_ENCONTRADO';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Cliente no encontrado.');
  }
}

export class FacturacionReferenciaInvalidaError extends DomainError {
  readonly codigo = 'FACTURACION_REFERENCIA_INVALIDA';
  readonly tipo = 'INVALIDO';
  constructor() {
    super('La zona de facturación o el plan de internet no existen.');
  }
}

export class FacturacionRutaNoEncontradaError extends DomainError {
  readonly codigo = 'FACTURACION_RUTA_NO_ENCONTRADA';
  readonly tipo = 'NO_ENCONTRADO';
  constructor() {
    super('Ruta de cobro no encontrada.');
  }
}
