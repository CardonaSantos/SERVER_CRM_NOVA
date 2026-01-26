import Decimal from 'decimal.js';
import { EstadoCuota } from '@prisma/client';

export const CREDITO_CUOTA = Symbol('CREDITO_CUOTA');
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
  public estaPagada(): boolean {
    return this.estado === EstadoCuota.PAGADA;
  }

  public aplicarPago(monto: Decimal): void {
    if (monto.lte(0)) {
      throw new Error('El monto debe ser mayor a 0');
    }

    const nuevoMonto = this.montoPagado.plus(monto);

    if (nuevoMonto.gt(this.montoTotal)) {
      throw new Error('El monto excede el saldo de la cuota');
    }

    this.montoPagado = nuevoMonto;

    if (this.montoPagado.eq(this.montoTotal)) {
      this.estado = EstadoCuota.PAGADA;
    } else {
      this.estado = EstadoCuota.PARCIAL;
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
