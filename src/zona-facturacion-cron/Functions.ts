import { FacturacionZona } from '@prisma/client';
import { Dayjs } from 'dayjs';

export function calcularPeriodo(
  zona: FacturacionZona, // tiene diaPago
  hoy: Dayjs, // ya en tz Guatemala
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
