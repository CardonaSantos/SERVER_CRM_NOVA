/**
 * Reglas del candado por arriendo (guía de cobranza §4.4).
 *
 * Quien ejecuta renueva el arriendo cada minuto; si el proceso muere nadie lo
 * renueva y a los 10 minutos la ejecución se considera abandonada. El repaso
 * corre cada 30 minutos, así que la espera de reintento es menor para que el
 * siguiente repaso ya la encuentre disponible.
 */
export const DURACION_ARRIENDO_MS = 10 * 60_000;

export const INTERVALO_RENOVACION_MS = 60_000;

/** Intentos por clave (una clave diaria = intentos por día). */
export const MAXIMO_INTENTOS_TAREA = 3;

export const ESPERA_REINTENTO_MS = 20 * 60_000;

/** Errores por elemento que se guardan con detalle en el resumen. */
export const MAXIMO_ERRORES_DETALLE = 50;

export const LONGITUD_MAXIMA_MENSAJE_ERROR = 500;

export function vencimientoArriendo(ahora: Date): Date {
  return new Date(ahora.getTime() + DURACION_ARRIENDO_MS);
}

export function siguienteReintento(ahora: Date): Date {
  return new Date(ahora.getTime() + ESPERA_REINTENTO_MS);
}
