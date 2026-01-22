import Decimal from 'decimal.js';
import { EstadoCuota } from '@prisma/client';

export class CuotaCredito {
  // Estado interno
  private estado: EstadoCuota;
  private montoPagado: Decimal;

  // Constructor privado
  private constructor(
    private readonly id: number | null,
    private readonly creditoId: number,

    private readonly numeroCuota: number,
    private readonly fechaVenc: Date,

    private readonly montoCapital: Decimal,
    private readonly montoInteres: Decimal,
    private readonly montoTotal: Decimal,

    estado: EstadoCuota,
    montoPagado: Decimal,
  ) {
    this.estado = estado;
    this.montoPagado = montoPagado;
  }

  /* ============================
   * FACTORY
   * ============================ */
  static crear(params: {
    creditoId: number;
    numeroCuota: number;
    fechaVenc: Date;

    montoCapital: Decimal;
    montoInteres: Decimal;
  }): CuotaCredito {
    if (params.numeroCuota <= 0) {
      throw new Error('El número de cuota debe ser mayor a 0');
    }

    if (params.montoCapital.lt(0)) {
      throw new Error('El monto de capital no puede ser negativo');
    }

    if (params.montoInteres.lt(0)) {
      throw new Error('El monto de interés no puede ser negativo');
    }

    const montoTotal = params.montoCapital.plus(params.montoInteres);

    return new CuotaCredito(
      null,
      params.creditoId,
      params.numeroCuota,
      params.fechaVenc,
      params.montoCapital,
      params.montoInteres,
      montoTotal,
      EstadoCuota.PENDIENTE,
      new Decimal(0),
    );
  }

  /* ============================
   * REHIDRATACIÓN
   * ============================ */
  static rehidratar(props: {
    id: number;
    creditoId: number;

    numeroCuota: number;
    fechaVenc: Date;

    montoCapital: Decimal;
    montoInteres: Decimal;
    montoTotal: Decimal;

    montoPagado: Decimal;
    estado: EstadoCuota;
  }): CuotaCredito {
    return new CuotaCredito(
      props.id,
      props.creditoId,
      props.numeroCuota,
      props.fechaVenc,
      props.montoCapital,
      props.montoInteres,
      props.montoTotal,
      props.estado,
      props.montoPagado,
    );
  }

  /* ============================
   * COMPORTAMIENTO DE DOMINIO
   * ============================ */

  aplicarPago(monto: Decimal): void {
    if (this.estado === EstadoCuota.PAGADA) {
      throw new Error('La cuota ya está pagada');
    }

    if (monto.lte(0)) {
      throw new Error('El monto del pago debe ser mayor a 0');
    }

    const pendiente = this.getMontoPendiente();

    if (monto.gt(pendiente)) {
      throw new Error('El pago excede el monto pendiente de la cuota');
    }

    this.montoPagado = this.montoPagado.plus(monto);

    if (this.montoPagado.eq(this.montoTotal)) {
      this.estado = EstadoCuota.PAGADA;
    }
  }

  marcarEnMora(): void {
    if (this.estado === EstadoCuota.PAGADA) return;
    this.estado = EstadoCuota.VENCIDA;
  }

  /* ============================
   * GETTERS (para mapper)
   * ============================ */

  getId() {
    return this.id;
  }

  getCreditoId() {
    return this.creditoId;
  }

  getNumeroCuota() {
    return this.numeroCuota;
  }

  getFechaVenc() {
    return this.fechaVenc;
  }

  getMontoCapital() {
    return this.montoCapital;
  }

  getMontoInteres() {
    return this.montoInteres;
  }

  getMontoTotal() {
    return this.montoTotal;
  }

  getMontoPagado() {
    return this.montoPagado;
  }

  getMontoPendiente() {
    return this.montoTotal.minus(this.montoPagado);
  }

  getEstado() {
    return this.estado;
  }
}
