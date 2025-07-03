import {
  EstadoCliente,
  FacturacionZona,
  ServicioInternet,
} from '@prisma/client';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);
const estadosAExcluir: EstadoCliente[] = [
  EstadoCliente.SUSPENDIDO,
  EstadoCliente.DESINSTALADO,
  EstadoCliente.EN_INSTALACION,
];

const TZ = 'America/Guatemala';

export const shouldSkipClient = (
  estadoCliente: EstadoCliente,
  servicioInternet: ServicioInternet | null,
): boolean => {
  return estadosAExcluir.includes(estadoCliente) || !servicioInternet;
};

export const shouldSkipZoneToday = (diaGeneracion?: number | null): boolean => {
  if (!diaGeneracion) return true; // no hay día → saltar

  const todayGT = dayjs().tz(TZ).date(); // 1-31 de hoy
  return diaGeneracion !== todayGT; // distinto → saltar
};

/**
 *
 * @param zona Zona de facturacion o corte
 * @param hoy el dia actual
 * @returns periodo unico para la factura, y decide si la factura es para este mes o el siguiente, en base al dia de generacion y pago
 */
export function calcularPeriodo(
  zona: FacturacionZona, // tiene diaPago (1–31)
  hoy: dayjs.Dayjs, // ya en tz 'America/Guatemala'
): string {
  // 1) Asegurarnos de no pasarnos del último día del mes
  const diaPagoDeseado = zona.diaPago;
  const ultimoDiaMes = hoy.daysInMonth();
  const diaValido = Math.min(diaPagoDeseado, ultimoDiaMes);

  // 2) “base” = este mes, día de pago válido, a medianoche
  const base = hoy.date(diaValido).startOf('day');

  // 3) Si ese día ya pasó (< hoy), facturamos en el mes siguiente
  const fechaReferencia = base.isBefore(hoy, 'day')
    ? base.add(1, 'month')
    : base;

  // 4) El periodo = 'YYYYMM' de esa fecha de referencia
  return fechaReferencia.format('YYYYMM');
}

export function formatearTelefonos(
  raw: (string | null | undefined)[],
): string[] {
  const planos = raw.filter(Boolean).flatMap((r) =>
    r!
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  return planos
    .map((tel) => {
      const limpio = tel.replace(/\D/g, '');
      if (limpio.startsWith('502') && limpio.length === 11)
        return `whatsapp:+${limpio}`;
      if (limpio.length === 8) return `whatsapp:+502${limpio}`;
      if (tel.startsWith('+')) return `whatsapp:${tel}`;
      return null;
    })
    .filter((t): t is string => !!t);
}
