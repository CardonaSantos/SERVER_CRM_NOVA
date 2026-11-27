/** Un periodo de trabajo técnico (el "reloj" del ticket). */
export type CicloTrabajo = {
  id: number;
  inicio: Date;
  fin: Date | null;
  duracionMinutos: number | null;
};

const MINUTO_MS = 60_000;

/** Un ciclo iniciado cuenta como mínimo un minuto. */
export function duracionCiclo(inicio: Date, fin: Date): number {
  return Math.max(
    Math.floor((fin.getTime() - inicio.getTime()) / MINUTO_MS),
    1,
  );
}

/**
 * Minutos trabajados; los ciclos abiertos corren hasta `ahora`.
 * `null` significa que no hay registro, que no es lo mismo que cero.
 */
export function tiempoTecnico(
  ciclos: CicloTrabajo[],
  ahora: Date,
): number | null {
  if (ciclos.length === 0) return null;

  return ciclos.reduce(
    (total, ciclo) =>
      total +
      (ciclo.fin === null
        ? duracionCiclo(ciclo.inicio, ahora)
        : (ciclo.duracionMinutos ?? 0)),
    0,
  );
}

export function tiempoTotal(apertura: Date, cierre: Date): number {
  return Math.max(
    Math.floor((cierre.getTime() - apertura.getTime()) / MINUTO_MS),
    0,
  );
}
