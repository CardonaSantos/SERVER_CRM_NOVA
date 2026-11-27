export function redondear(valor: number, decimales = 2): number {
  const factor = 10 ** decimales;
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

/** `null` si no hay datos: sin registro no es cero. */
export function promedio(valores: number[]): number | null {
  if (!valores.length) return null;

  return redondear(valores.reduce((a, b) => a + b, 0) / valores.length);
}

/** `null` si falta una fecha o el final es anterior al inicio. */
export function minutosEntre(
  inicio: Date | null,
  fin: Date | null,
): number | null {
  if (!inicio || !fin) return null;

  const diferencia = fin.getTime() - inicio.getTime();

  return diferencia < 0 ? null : diferencia / 60_000;
}

export function soloNumeros(valores: Array<number | null>): number[] {
  return valores.filter((valor): valor is number => valor !== null);
}

/** `null` cuando el período anterior era cero y el actual no. */
export function variacionPorcentaje(
  actual: number,
  anterior: number,
): number | null {
  if (anterior === 0) return actual === 0 ? 0 : null;

  return redondear(((actual - anterior) / anterior) * 100);
}
