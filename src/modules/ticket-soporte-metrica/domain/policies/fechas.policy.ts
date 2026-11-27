// Cálculo sobre fechas de negocio `YYYY-MM-DD`; no dependen de ninguna zona horaria.

const MS_DIA = 86_400_000;

function aUtc(fecha: string): number {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return Date.UTC(anio, mes - 1, dia);
}

function deUtc(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export function esFecha(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && deUtc(aUtc(fecha)) === fecha;
}

/** Días entre dos fechas contando ambas. 0 si `hasta` es anterior a `desde`. */
export function diasEntre(desde: string, hasta: string): number {
  return Math.max(0, Math.round((aUtc(hasta) - aUtc(desde)) / MS_DIA) + 1);
}

/** Días ya transcurridos de un periodo, contando hoy. */
export function diasTranscurridos(
  desde: string,
  hasta: string,
  hoy: string,
): number {
  return diasEntre(desde, hoy < hasta ? hoy : hasta);
}

/** Todas las fechas del periodo, en orden. */
export function fechasEntre(desde: string, hasta: string): string[] {
  return Array.from({ length: diasEntre(desde, hasta) }, (_, i) =>
    deUtc(aUtc(desde) + i * MS_DIA),
  );
}

/** Primer y último día de un mes `YYYY-MM`. */
export function periodoDeMes(mes: string): { desde: string; hasta: string } {
  const [anio, numero] = mes.split('-').map(Number);

  return {
    desde: `${mes}-01`,
    hasta: deUtc(Date.UTC(anio, numero, 0)),
  };
}

/** Cierre estimado del periodo si se mantiene el ritmo actual. */
export function proyectar(
  avance: number,
  transcurridos: number,
  totales: number,
): number {
  return transcurridos ? Math.round((avance / transcurridos) * totales) : 0;
}
