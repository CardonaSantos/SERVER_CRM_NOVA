import Decimal from 'decimal.js';

export class PagoCuota {
  private constructor(
    private readonly id: number | null,
    private readonly monto: Decimal,
    private readonly fechaPago: Date,
    private readonly metodoPago?: string,
    private readonly referencia?: string,
    private readonly observacion?: string,
  ) {}

  static crear(params: {
    monto: Decimal;
    fechaPago?: Date;
    metodoPago?: string;
    referencia?: string;
    observacion?: string;
  }): PagoCuota {
    if (params.monto.lte(0)) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    return new PagoCuota(
      null,
      params.monto,
      params.fechaPago ?? new Date(),
      params.metodoPago,
      params.referencia,
      params.observacion,
    );
  }

  static rehidratar(params: {
    id: number;
    monto: Decimal;
    fechaPago: Date;
    metodoPago?: string;
    referencia?: string;
    observacion?: string;
  }): PagoCuota {
    return new PagoCuota(
      params.id,
      params.monto,
      params.fechaPago,
      params.metodoPago,
      params.referencia,
      params.observacion,
    );
  }

  /** Solo devuelve su propio monto */
  public revertir(): Decimal {
    return this.monto;
  }

  getId() {
    return this.id;
  }

  getMonto() {
    return this.monto;
  }

  getFechaPago() {
    return this.fechaPago;
  }

  getMetodoPago() {
    return this.metodoPago;
  }

  getReferencia() {
    return this.referencia;
  }

  getObservacion() {
    return this.observacion;
  }
}
