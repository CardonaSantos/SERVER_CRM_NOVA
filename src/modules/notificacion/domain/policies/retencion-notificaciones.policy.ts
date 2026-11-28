/** Días que se guardan las notificaciones (guía de cobranza §4.1). */
export const RETENCION_NOTIFICACIONES_DIAS = 90;

const DIA_MS = 86_400_000;

/** Se borran las creadas antes de este instante. */
export function corteRetencionNotificaciones(ahora: Date): Date {
  return new Date(ahora.getTime() - RETENCION_NOTIFICACIONES_DIAS * DIA_MS);
}
