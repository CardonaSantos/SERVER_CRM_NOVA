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

export function calcularPeriodo(
  zona: FacturacionZona, // tiene diaPago
  hoy: dayjs.Dayjs, // ya en tz Guatemala
): string {
  const diaPago = zona.diaPago;
  const base = hoy.date(diaPago).startOf('day');
  const periodo = base.isBefore(hoy, 'day') ? base.add(1, 'month') : base;
  return periodo.format('YYYYMM'); // «202506»
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
