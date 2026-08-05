type MonthlyActivityInput = {
  year: number;
  month: number;
  currentDay: number;
  ticketDates: Date[];
  installationDates: Date[];
};

type ActividadDiaria = {
  fecha: string;
  etiqueta: string;
  tickets: number;
  instalaciones: number;
  total: number;
};

const GUATEMALA_UTC_OFFSET_HOURS = 6;

export function getDashboardRangesGuatemala(now = new Date()) {
  const parts = getGuatemalaDateParts(now);

  const inicioMes = createGuatemalaMidnightUtc(parts.year, parts.month, 1);

  const finMes = createGuatemalaMidnightUtc(parts.year, parts.month + 1, 1);

  const inicioHoy = createGuatemalaMidnightUtc(
    parts.year,
    parts.month,
    parts.day,
  );

  const finHoy = createGuatemalaMidnightUtc(
    parts.year,
    parts.month,
    parts.day + 1,
  );

  return {
    ...parts,
    inicioMes,
    finMes,
    inicioHoy,
    finHoy,
    diasTranscurridos: Math.max(parts.day, 1),
  };
}

export function getGuatemalaDateParts(date: Date) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Guatemala',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
  }).formatToParts(date);

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value),
  };
}

export function createGuatemalaMidnightUtc(
  year: number,
  month: number,
  day: number,
) {
  /*
   * Date.UTC acepta el desbordamiento:
   * month=13 pasa a enero del siguiente año.
   * day=32 pasa al siguiente mes.
   */
  return new Date(
    Date.UTC(year, month - 1, day, GUATEMALA_UTC_OFFSET_HOURS, 0, 0, 0),
  );
}

export function getGuatemalaDateKey(date: Date) {
  const { year, month, day } = getGuatemalaDateParts(date);

  return [
    year,
    String(month).padStart(2, '0'),
    String(day).padStart(2, '0'),
  ].join('-');
}

export function buildMonthlyActivity({
  year,
  month,
  currentDay,
  ticketDates,
  installationDates,
}: MonthlyActivityInput): ActividadDiaria[] {
  const activity = new Map<string, ActividadDiaria>();

  for (let day = 1; day <= currentDay; day += 1) {
    const fecha = [
      year,
      String(month).padStart(2, '0'),
      String(day).padStart(2, '0'),
    ].join('-');

    activity.set(fecha, {
      fecha,
      etiqueta: formatShortDayLabel(year, month, day),
      tickets: 0,
      instalaciones: 0,
      total: 0,
    });
  }

  for (const date of ticketDates) {
    const key = getGuatemalaDateKey(date);
    const item = activity.get(key);

    if (!item) continue;

    item.tickets += 1;
    item.total += 1;
  }

  for (const date of installationDates) {
    const key = getGuatemalaDateKey(date);
    const item = activity.get(key);

    if (!item) continue;

    item.instalaciones += 1;
    item.total += 1;
  }

  return Array.from(activity.values());
}

export function formatShortDayLabel(year: number, month: number, day: number) {
  /*
   * Se usa mediodía UTC para evitar que la fecha cambie al
   * convertirla a Guatemala.
   */
  const date = new Date(Date.UTC(year, month - 1, day, 12));

  const weekday = new Intl.DateTimeFormat('es-GT', {
    timeZone: 'America/Guatemala',
    weekday: 'short',
  })
    .format(date)
    .replace('.', '');

  return `${weekday} ${day}`;
}

export function getTicketResolutionDate(ticket: {
  fechaResolucionTecnico: Date | null;
  fechaCierre: Date | null;
  asignaciones: Array<{
    resolvioEn: Date | null;
  }>;
}) {
  return (
    ticket.fechaResolucionTecnico ??
    ticket.fechaCierre ??
    ticket.asignaciones[0]?.resolvioEn ??
    null
  );
}

export function getMaximumActivityDay(items: ActividadDiaria[]) {
  if (items.length === 0) return null;

  return items.reduce((maximum, item) =>
    item.total > maximum.total ? item : maximum,
  );
}

export function getMinimumActivityDay(items: ActividadDiaria[]) {
  if (items.length === 0) return null;

  return items.reduce((minimum, item) =>
    item.total < minimum.total ? item : minimum,
  );
}

export function getMinutesBetween(
  start: Date | null | undefined,
  end: Date | null | undefined,
): number | null {
  if (!start || !end) return null;

  const difference = end.getTime() - start.getTime();

  if (difference < 0) return null;

  return difference / 60_000;
}

export function average(values: number[]): number | null {
  if (values.length === 0) return null;

  const total = values.reduce((sum, value) => sum + value, 0);

  return round(total / values.length, 2);
}

export function round(value: number, decimals = 2) {
  const factor = 10 ** decimals;

  return Math.round((value + Number.EPSILON) * factor) / factor;
}

export function isFiniteNumber(
  value: number | null | undefined,
): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isDate(value: Date | null | undefined): value is Date {
  return value instanceof Date;
}
