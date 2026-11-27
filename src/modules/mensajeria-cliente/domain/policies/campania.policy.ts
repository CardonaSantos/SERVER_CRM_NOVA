import { EstadoCampania } from '../enums/campania.enum';

/** Sin avance en este tiempo, el envío se cortó (p. ej. se reinició el servidor). */
export const INACTIVIDAD_MAXIMA_MS = 5 * 60 * 1000;

/** Última actividad que todavía cuenta como "enviándose". */
export function limiteDeActividad(ahora: Date): Date {
  return new Date(ahora.getTime() - INACTIVIDAD_MAXIMA_MS);
}

/** Estado real: una campaña "en curso" detenida está interrumpida. */
export function estadoVigente(
  campania: { estado: EstadoCampania; actividadEn: Date },
  ahora: Date,
): EstadoCampania {
  const detenida =
    campania.estado === EstadoCampania.EN_CURSO &&
    campania.actividadEn < limiteDeActividad(ahora);
  return detenida ? EstadoCampania.INTERRUMPIDA : campania.estado;
}
