import Decimal from 'decimal.js';
import { EstadoCuota } from '@prisma/client';
import { PagoCuota } from 'src/credito/cuotas-pago/entities/cuotas-pago.entity';

export const CREDITO_CUOTA = Symbol('CREDITO_CUOTA');

export class CuotaCredito {
  /* ============================
   * ESTADO INTERNO
   * ============================ */
  private estado: EstadoCuota;
  private montoPagado: Decimal;
  private pagos: PagoCuota[] = [];

  /* ============================
   * CONSTRUCTOR
   * ============================ */
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
   * FACTORIES (Creación y Rehidratación)
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
    pagos?: PagoCuota[];
  }): CuotaCredito {
    const cuota = new CuotaCredito(
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

    if (props.pagos) {
      cuota.pagos = props.pagos;
    }

    return cuota;
  }

  /* ============================
   * DOMINIO: ACCIONES (Modifican estado)
   * ============================ */
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

  public aplicarPagoEntidad(pago: PagoCuota): void {
    this.aplicarPago(pago.getMonto());
    this.pagos.push(pago);
  }

  public eliminarPago(pagoId: number): Decimal {
    const pagoIndex = this.pagos.findIndex((p) => p.getId() === pagoId);

    if (pagoIndex === -1) {
      throw new Error('El pago no pertenece a esta cuota');
    }

    const pago = this.pagos[pagoIndex];

    this.pagos.splice(pagoIndex, 1);
    this.montoPagado = this.montoPagado.minus(pago.getMonto());

    if (this.montoPagado.lt(0)) {
      throw new Error('Estado inválido: montoPagado negativo');
    }

    this.recalcularEstado();

    return pago.getMonto();
  }

  public marcarEnMora(): void {
    if (this.estado === EstadoCuota.PAGADA) return;
    this.estado = EstadoCuota.VENCIDA;
  }

  /* ============================
   * DOMINIO: CONSULTAS (Lectura lógica)
   * ============================ */
  public estaPagada(): boolean {
    return this.estado === EstadoCuota.PAGADA;
  }

  public tienePago(pagoId: number): boolean {
    return this.pagos.some((p) => p.getId() === pagoId);
  }

  /* ============================
   * MÉTODOS PRIVADOS (Helpers)
   * ============================ */
  private recalcularEstado(): void {
    if (this.montoPagado.eq(0)) {
      this.estado = EstadoCuota.PENDIENTE;
    } else if (this.montoPagado.eq(this.montoTotal)) {
      this.estado = EstadoCuota.PAGADA;
    } else {
      this.estado = EstadoCuota.PARCIAL;
    }
  }

  /* ============================
   * GETTERS (Acceso a propiedades)
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

  getPagos(): PagoCuota[] {
    return this.pagos;
  }
}
