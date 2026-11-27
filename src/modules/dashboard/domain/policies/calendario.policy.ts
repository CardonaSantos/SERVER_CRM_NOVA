/**
 * Aritmética sobre fechas de negocio `YYYY-MM-DD`. No hay horas ni zonas: la
 * conversión a instantes ocurre en `infra/`.
 */
export type RangoFechas = {
  /** Incluida. */
  desde: string;
  /** Excluida. */
  hastaExclusivo: string;
};

const MS_DIA = 86_400_000;

export function sumarDias(fecha: string, dias: number): string {
  return aTexto(new Date(aUtc(fecha) + dias * MS_DIA));
}

/** Conserva el día; si el mes destino es más corto, queda en su último día. */
export function sumarMeses(fecha: string, meses: number): string {
  const [anio, mes, dia] = partes(fecha);
  const ultimo = new Date(Date.UTC(anio, mes - 1 + meses + 1, 0)).getUTCDate();

  return aTexto(
    new Date(Date.UTC(anio, mes - 1 + meses, Math.min(dia, ultimo))),
  );
}

export function inicioDeMes(fecha: string): string {
  return `${fecha.slice(0, 7)}-01`;
}

export function diasEntre(desde: string, hasta: string): number {
  return Math.round((aUtc(hasta) - aUtc(desde)) / MS_DIA);
}

export function diaDelMes(fecha: string): number {
  return partes(fecha)[2];
}

export function partes(fecha: string): [number, number, number] {
  const [anio, mes, dia] = fecha.split('-').map(Number);
  return [anio, mes, dia];
}

function aUtc(fecha: string): number {
  const [anio, mes, dia] = partes(fecha);
  return Date.UTC(anio, mes - 1, dia);
}

function aTexto(instante: Date): string {
  return instante.toISOString().slice(0, 10);
}
