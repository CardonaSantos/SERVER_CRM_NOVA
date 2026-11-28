import { EjecucionTareaInvalidaError } from '../errors/tareas-programadas.errors';

/** Días que se guarda el registro de ejecuciones (guía de cobranza §4.1). */
export const RETENCION_EJECUCIONES_DIAS = 180;

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** `YYYY-MM-DD` menos `dias` días de calendario. */
export function restarDias(fecha: string, dias: number): string {
  if (!FECHA.test(fecha) || !Number.isInteger(dias) || dias < 0) {
    throw new EjecucionTareaInvalidaError(
      'La fecha o los días de retención no son válidos.',
    );
  }
  const [anio, mes, dia] = fecha.split('-').map(Number);
  const utc = new Date(Date.UTC(anio, mes - 1, dia - dias));
  return utc.toISOString().slice(0, 10);
}
