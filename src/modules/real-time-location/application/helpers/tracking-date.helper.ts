const TRACKING_TIME_ZONE = 'America/Guatemala';

export function getTrackingBusinessDate(instant: Date): Date {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new Error('El instante recibido no es válido.');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TRACKING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(instant);

  const year = Number(parts.find((part) => part.type === 'year')?.value);

  const month = Number(parts.find((part) => part.type === 'month')?.value);

  const day = Number(parts.find((part) => part.type === 'day')?.value);

  /*
   * Representamos el día lógico como medianoche UTC
   * para que el Date tenga una representación estable
   * independientemente de la zona horaria del servidor.
   */
  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
}
