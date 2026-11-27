import { FacturaInvalidaError } from '../errors/facturacion.errors';

/**
 * Fechas y textos con los que nacen las facturas. Es el mismo cálculo que ya se
 * usaba: cambiarlo altera facturas reales.
 */

const MESES = [
  'ENERO',
  'FEBRERO',
  'MARZO',
  'ABRIL',
  'MAYO',
  'JUNIO',
  'JULIO',
  'AGOSTO',
  'SEPTIEMBRE',
  'OCTUBRE',
  'NOVIEMBRE',
  'DICIEMBRE',
];

/** Guatemala es UTC-6 todo el año: su medianoche son las 06:00 UTC. */
const MEDIANOCHE_GUATEMALA_UTC = 6;

export type MesFacturado = { anio: number; mes: number };

export type FechasFactura = { periodo: string; fechaPagoEsperada: Date };

const periodo = (anio: number, mes: number): string =>
  `${anio}${String(mes).padStart(2, '0')}`;

/** Los meses de `mesInicio` a `mesFin` del mismo año. */
export function mesesEntre(
  anio: number,
  mesInicio: number,
  mesFin: number,
): MesFacturado[] {
  const validos = [mesInicio, mesFin].every(
    (mes) => Number.isInteger(mes) && mes >= 1 && mes <= 12,
  );
  if (!validos) {
    throw new FacturaInvalidaError('Los meses deben estar entre 1 y 12.');
  }
  if (mesInicio > mesFin) {
    throw new FacturaInvalidaError(
      'El mes de inicio no puede ser mayor que el mes final.',
    );
  }
  if (!Number.isInteger(anio) || anio < 2000) {
    throw new FacturaInvalidaError('El año no es válido.');
  }

  return Array.from({ length: mesFin - mesInicio + 1 }, (_, i) => ({
    anio,
    mes: mesInicio + i,
  }));
}

/**
 * Factura generada para un mes: vence el día de pago de la zona (o el último
 * del mes si no llega), a las 00:00 de Guatemala.
 */
export function fechasDelMes(
  { anio, mes }: MesFacturado,
  diaPago: number,
): FechasFactura {
  const ultimoDia = new Date(Date.UTC(anio, mes, 0)).getUTCDate();
  const dia = Math.min(diaPago, ultimoDia);

  return {
    periodo: periodo(anio, mes),
    fechaPagoEsperada: new Date(
      Date.UTC(anio, mes - 1, dia, MEDIANOCHE_GUATEMALA_UTC),
    ),
  };
}

export function detalleDelMes(
  { anio, mes }: MesFacturado,
  plan: { nombre: string; precio: number },
): string {
  return `Factura correspondiente a ${MESES[mes - 1]} ${anio} por Q${plan.precio.toFixed(2)} | ${plan.nombre}`;
}

/**
 * Primera factura de un cliente: el día de pago de la zona dentro del mes del
 * alta, en la hora del servidor. Un día que el mes no tiene pasa al siguiente.
 */
export function fechasPrimeraFactura(
  ahora: Date,
  diaPago: number,
): FechasFactura {
  const fecha = new Date(ahora);
  fecha.setDate(diaPago);

  return {
    periodo: periodo(fecha.getFullYear(), fecha.getMonth() + 1),
    fechaPagoEsperada: fecha,
  };
}

export function detallePrimeraFactura(plan: {
  nombre: string;
  velocidad: string | null;
}): string {
  return `Pago mensual servicio ${plan.nombre} (${plan.velocidad})`;
}
