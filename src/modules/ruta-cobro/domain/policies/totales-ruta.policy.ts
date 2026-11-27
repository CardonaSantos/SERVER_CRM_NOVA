/** Montos en quetzales con dos decimales (la BD los guarda como `Float`). */
const aCentavos = (monto: number): number => Math.round(monto * 100) / 100;

const sumar = (montos: number[]): number =>
  aCentavos(montos.reduce((total, monto) => total + monto, 0));

/** Lo que falta pagar de una factura con deuda: sale de sus pagos. */
export const saldoDeFactura = (monto: number, pagos: number[]): number =>
  Math.max(aCentavos(monto - sumar(pagos)), 0);

export const sumarSaldos = (saldos: number[]): number => sumar(saldos);

export type TotalesRutaCobro = {
  clientes: number;
  /** Clientes a los que ya se les cobró algo en esta ruta. */
  clientesCobrados: number;
  facturasPendientes: number;
  /** Saldo de las facturas con deuda de los clientes de la ruta. */
  porCobrar: number;
  /** Suma de los pagos registrados en esta ruta desde que se creó. */
  cobrado: number;
};

/**
 * Lo cobrado no es un acumulador que se guarde: sale de los pagos de la ruta
 * cada vez que se consulta.
 */
export function calcularTotalesRuta(datos: {
  /** Un arreglo por cliente con el saldo de cada factura que debe. */
  saldosPorCliente: number[][];
  /** Lo cobrado en la ruta, agrupado por cliente. */
  cobros: { clienteId: number; monto: number }[];
}): TotalesRutaCobro {
  const saldos = datos.saldosPorCliente.flat();

  return {
    clientes: datos.saldosPorCliente.length,
    clientesCobrados: new Set(datos.cobros.map((c) => c.clienteId)).size,
    facturasPendientes: saldos.length,
    porCobrar: sumar(saldos),
    cobrado: sumar(datos.cobros.map((c) => c.monto)),
  };
}
