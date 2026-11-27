import { MetodoPago } from '../enums/metodo-pago.enum';
import { OrigenPago } from '../enums/origen-pago.enum';

export type PagoProps = {
  id: number | null;
  facturaId: number;
  clienteId: number;
  montoPagado: number;
  metodoPago: MetodoPago;
  fechaPago: Date;
  creadoEn: Date;
  cobradorId: number | null;
  /** Número de boleta o de transferencia; único en todo el sistema. */
  numeroBoleta: string | null;
  codigoConfirmacion: string | null;
  origen: OrigenPago;
  rutaId: number | null;
};

export type RegistrarPagoProps = {
  facturaId: number;
  clienteId: number;
  montoPagado: number;
  metodoPago: MetodoPago;
  fechaPago: Date;
  cobradorId: number;
  numeroBoleta?: string | null;
  origen: OrigenPago;
  rutaId?: number | null;
};
