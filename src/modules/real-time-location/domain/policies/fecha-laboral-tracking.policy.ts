import { TrackingDatosInvalidosError } from '../errors/real-time-location.errors';

const TRACKING_TIME_ZONE = 'America/Guatemala';

export function getTrackingBusinessDate(instant: Date): Date {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new TrackingDatosInvalidosError('El instante recibido no es válido.');
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

/**
 * Clave del cierre de recorridos abandonados para la vuelta de un instante:
 * una por fecha y hora de Guatemala (corre a los :45 de cada dos horas).
 */
export function claveExpiracionTracking(instant: Date): string {
  if (!(instant instanceof Date) || Number.isNaN(instant.getTime())) {
    throw new TrackingDatosInvalidosError('El instante recibido no es válido.');
  }

  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: TRACKING_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(instant);
  const valor = (tipo: Intl.DateTimeFormatPartTypes) =>
    parts.find((part) => part.type === tipo)?.value;

  return `TRACKING_EXPIRACION:${valor('year')}-${valor('month')}-${valor('day')}T${valor('hour')}:45`;
}
