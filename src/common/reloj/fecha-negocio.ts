import { dayjs } from 'src/Utils/dayjs.config';

/**
 * Conversión entre instantes y fechas de negocio (`YYYY-MM-DD` en
 * America/Guatemala). Se usa en adaptadores (infra) y en el reloj; el
 * dominio no importa dayjs.
 */
export const ZONA_HORARIA_NEGOCIO = 'America/Guatemala';

const FORMATO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/** Fecha de negocio (`YYYY-MM-DD`) del instante dado, en Guatemala. */
export function fechaNegocioDe(instante: Date): string {
  return dayjs(instante).tz(ZONA_HORARIA_NEGOCIO).format('YYYY-MM-DD');
}

/** `true` si es `YYYY-MM-DD` y la fecha existe en el calendario. */
export function esFechaNegocioValida(fecha: unknown): fecha is string {
  if (typeof fecha !== 'string' || !FORMATO_FECHA.test(fecha)) return false;

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const utc = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    utc.getUTCFullYear() === anio &&
    utc.getUTCMonth() === mes - 1 &&
    utc.getUTCDate() === dia
  );
}

/** Instante de las 00:00 de esa fecha de negocio en Guatemala. */
export function inicioDiaNegocio(fecha: string): Date {
  if (!esFechaNegocioValida(fecha)) {
    throw new RangeError(`Fecha de negocio inválida: ${String(fecha)}`);
  }

  return dayjs.tz(`${fecha} 00:00:00`, ZONA_HORARIA_NEGOCIO).toDate();
}

/**
 * Rango para filtrar por días completos de negocio (estándar §7.6):
 * `>= desde 00:00` y `< (hasta + 1 día) 00:00`, en Guatemala.
 *
 * @example
 * where: { creadoEn: rangoDiasNegocio(filtros.desde, filtros.hasta) }
 */
export function rangoDiasNegocio(
  desde?: string | null,
  hasta?: string | null,
): { gte?: Date; lt?: Date } {
  const rango: { gte?: Date; lt?: Date } = {};

  if (desde) {
    rango.gte = inicioDiaNegocio(desde);
  }

  if (hasta) {
    rango.lt = dayjs(inicioDiaNegocio(hasta))
      .tz(ZONA_HORARIA_NEGOCIO)
      .add(1, 'day')
      .toDate();
  }

  return rango;
}
