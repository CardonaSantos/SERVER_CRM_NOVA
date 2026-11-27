import { EstadoFactura } from '../enums/estado-factura.enum';

export type FacturaProps = {
  id: number | null;
  empresaId: number;
  clienteId: number;
  facturacionZonaId: number | null;
  /** Mes facturado, `YYYYMM`. */
  periodo: string;
  montoPago: number;
  saldoPendiente: number;
  estado: EstadoFactura;
  fechaPagoEsperada: Date | null;
  /** Fecha del pago que la saldó. */
  fechaPagada: Date | null;
  detalleFactura: string | null;
  nombreClienteFactura: string | null;
  creadorId: number | null;
  creadoEn: Date;
  actualizadoEn: Date;
};

/** Lo que la factura necesita saber de cada pago suyo. */
export type PagoAplicado = {
  id: number | null;
  monto: number;
  fecha: Date;
};

export type EmitirFacturaProps = {
  empresaId: number;
  clienteId: number;
  facturacionZonaId: number;
  periodo: string;
  montoPago: number;
  fechaPagoEsperada: Date;
  detalleFactura: string;
  nombreClienteFactura: string;
  creadorId?: number | null;
};

/** Lo que no llega no cambia. El estado y la fecha pagada salen de los pagos. */
export type EditarFacturaProps = {
  montoPago?: number;
  detalleFactura?: string;
  fechaPagoEsperada?: Date;
};
