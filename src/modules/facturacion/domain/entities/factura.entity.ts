import { ESTADOS_CON_DEUDA, EstadoFactura } from '../enums/estado-factura.enum';
import {
  FacturaAnuladaError,
  FacturaConPagosError,
  FacturaInvalidaError,
  FacturaMontoMenorQuePagadoError,
  FacturaSinDeudaError,
  PagoExcedeSaldoError,
  PagoInvalidoError,
  PagoNoEncontradoError,
} from '../errors/facturacion.errors';
import { esMonto, redondear, sumar } from '../policies/dinero.policy';
import {
  EditarFacturaProps,
  EmitirFacturaProps,
  FacturaProps,
  PagoAplicado,
} from '../props/factura.props';

/**
 * Una factura de internet con sus pagos. El saldo, el estado y la fecha pagada
 * salen de los pagos; a mano solo se anula o reactiva.
 */
export class FacturaEntity {
  private constructor(
    private props: FacturaProps,
    private pagos: PagoAplicado[],
  ) {}

  static emitir(input: EmitirFacturaProps, ahora: Date): FacturaEntity {
    if (!esMonto(input.montoPago)) {
      throw new FacturaInvalidaError('El monto de la factura no es válido.');
    }

    return new FacturaEntity(
      {
        ...input,
        creadorId: input.creadorId ?? null,
        id: null,
        saldoPendiente: input.montoPago,
        estado: EstadoFactura.PENDIENTE,
        fechaPagada: null,
        creadoEn: new Date(ahora),
        actualizadoEn: new Date(ahora),
      },
      [],
    );
  }

  /** No corrige registros anteriores: se leen como están. */
  static hydrate(props: FacturaProps, pagos: PagoAplicado[]): FacturaEntity {
    if (props.id !== null && (!Number.isInteger(props.id) || props.id <= 0)) {
      throw new FacturaInvalidaError('La factura no es válida.');
    }

    return new FacturaEntity({ ...props }, [...pagos]);
  }

  /** Aplica un pago nuevo. */
  registrarPago(monto: number, fechaPago: Date, ahora: Date): void {
    this.asegurarVigente();
    if (this.props.estado === EstadoFactura.PAGADA || this.porPagar() <= 0) {
      throw new FacturaSinDeudaError();
    }
    if (!esMonto(monto) || monto <= 0) {
      throw new PagoInvalidoError('El monto pagado debe ser mayor que cero.');
    }
    if (redondear(monto - this.porPagar()) > 0) {
      throw new PagoExcedeSaldoError(this.porPagar());
    }

    this.pagos.push({ id: null, monto, fecha: new Date(fechaPago) });
    this.recalcular(ahora);
  }

  /** Quita un pago que se va a eliminar. */
  quitarPago(pagoId: number, ahora: Date): void {
    const restantes = this.pagos.filter((pago) => pago.id !== pagoId);
    if (restantes.length === this.pagos.length) {
      throw new PagoNoEncontradoError();
    }

    this.pagos = restantes;
    this.recalcular(ahora);
  }

  editar(cambios: EditarFacturaProps, ahora: Date): void {
    this.asegurarVigente();

    const { montoPago, detalleFactura, fechaPagoEsperada } = cambios;
    if (montoPago !== undefined && montoPago !== this.props.montoPago) {
      if (!esMonto(montoPago)) {
        throw new FacturaInvalidaError('El monto de la factura no es válido.');
      }
      if (redondear(this.totalPagado - montoPago) > 0) {
        throw new FacturaMontoMenorQuePagadoError(this.totalPagado);
      }
      this.props.montoPago = montoPago;
      this.recalcular(ahora);
    }
    if (detalleFactura !== undefined) {
      this.props.detalleFactura = detalleFactura;
    }
    if (fechaPagoEsperada !== undefined) {
      this.props.fechaPagoEsperada = new Date(fechaPagoEsperada);
    }
    this.props.actualizadoEn = new Date(ahora);
  }

  /** Deja de cobrarse; solo si no tiene pagos. Idempotente. */
  anular(ahora: Date): void {
    if (this.isAnulada) return;
    if (this.tienePagos) throw new FacturaConPagosError();

    this.props.estado = EstadoFactura.ANULADA;
    this.props.saldoPendiente = 0;
    this.props.fechaPagada = null;
    this.props.actualizadoEn = new Date(ahora);
  }

  /** Vuelve a cobrarse una factura anulada. Idempotente. */
  reactivar(ahora: Date): void {
    if (!this.isAnulada) return;

    this.props.estado = EstadoFactura.PENDIENTE;
    this.recalcular(ahora);
  }

  asegurarEliminable(): void {
    if (this.tienePagos) throw new FacturaConPagosError();
  }

  get id(): number | null {
    return this.props.id;
  }

  get clienteId(): number {
    return this.props.clienteId;
  }

  get empresaId(): number {
    return this.props.empresaId;
  }

  get estado(): EstadoFactura {
    return this.props.estado;
  }

  get saldoPendiente(): number {
    return this.props.saldoPendiente;
  }

  get isAnulada(): boolean {
    return this.props.estado === EstadoFactura.ANULADA;
  }

  get tienePagos(): boolean {
    return this.pagos.length > 0;
  }

  get totalPagado(): number {
    return sumar(this.pagos.map((pago) => pago.monto));
  }

  get seDebe(): boolean {
    return ESTADOS_CON_DEUDA.includes(this.props.estado);
  }

  toPrimitives(): FacturaProps {
    const { fechaPagoEsperada, fechaPagada } = this.props;

    return {
      ...this.props,
      fechaPagoEsperada: fechaPagoEsperada && new Date(fechaPagoEsperada),
      fechaPagada: fechaPagada && new Date(fechaPagada),
      creadoEn: new Date(this.props.creadoEn),
      actualizadoEn: new Date(this.props.actualizadoEn),
    };
  }

  private porPagar(): number {
    return Math.max(redondear(this.props.montoPago - this.totalPagado), 0);
  }

  private asegurarVigente(): void {
    if (this.isAnulada) throw new FacturaAnuladaError();
  }

  private recalcular(ahora: Date): void {
    this.props.actualizadoEn = new Date(ahora);
    if (this.isAnulada) return;

    const saldo = this.porPagar();
    this.props.saldoPendiente = saldo;

    if (this.tienePagos && saldo <= 0) {
      this.props.estado = EstadoFactura.PAGADA;
      this.props.fechaPagada = new Date(
        Math.max(...this.pagos.map((pago) => pago.fecha.getTime())),
      );
      return;
    }

    this.props.fechaPagada = null;
    if (this.tienePagos) {
      this.props.estado = EstadoFactura.PARCIAL;
    } else if (this.props.estado !== EstadoFactura.VENCIDA) {
      this.props.estado = EstadoFactura.PENDIENTE;
    }
  }
}
