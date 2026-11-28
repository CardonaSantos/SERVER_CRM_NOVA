import { EstadoEjecucionTarea } from '../enums/ejecucion-tarea.enum';

/** En ejecución con el arriendo vencido: nadie la está corriendo. */
export function estaAbandonada(
  ejecucion: { estado: EstadoEjecucionTarea; bloqueadoHasta: Date | null },
  ahora: Date,
): boolean {
  return (
    ejecucion.estado === EstadoEjecucionTarea.EJECUTANDO &&
    (!ejecucion.bloqueadoHasta ||
      ejecucion.bloqueadoHasta.getTime() <= ahora.getTime())
  );
}
