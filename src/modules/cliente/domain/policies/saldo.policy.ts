/** Estados en los que una factura todavía se debe. */
export const ESTADOS_FACTURA_CON_DEUDA = [
  'PENDIENTE',
  'PARCIAL',
  'VENCIDA',
] as const;

export type FacturaParaSaldo = {
  estado: string;
  monto: number;
  pagos: { montoPagado: number; fechaPago: Date }[];
};

export type SaldoCliente = {
  /** Lo que se debe de las facturas pendientes, parciales o vencidas. */
  saldoPendiente: number;
  /** Suma de las facturas ya pagadas. */
  totalPagado: number;
  ultimoPago: Date | null;
};

export const tieneDeuda = (estado: string): boolean =>
  (ESTADOS_FACTURA_CON_DEUDA as readonly string[]).includes(estado);

const aCentavos = (valor: number): number => Math.round(valor * 100) / 100;

/**
 * El saldo no es un registro que suba o baje: sale de las facturas y sus pagos
 * cada vez que se consulta.
 */
export function calcularSaldo(facturas: FacturaParaSaldo[]): SaldoCliente {
  let saldoPendiente = 0;
  let totalPagado = 0;
  let ultimoPago: Date | null = null;

  for (const factura of facturas) {
    let pagado = 0;

    for (const pago of factura.pagos) {
      pagado += pago.montoPagado;
      if (!ultimoPago || pago.fechaPago > ultimoPago) {
        ultimoPago = pago.fechaPago;
      }
    }

    if (tieneDeuda(factura.estado)) {
      saldoPendiente += Math.max(factura.monto - pagado, 0);
    }
    if (factura.estado === 'PAGADA') totalPagado += factura.monto;
  }

  return {
    saldoPendiente: aCentavos(saldoPendiente),
    totalPagado: aCentavos(totalPagado),
    ultimoPago,
  };
}
