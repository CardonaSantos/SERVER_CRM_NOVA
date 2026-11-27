import { dayjs } from 'src/Utils/dayjs.config';

/** Las fechas del reporte son las de Guatemala, corra donde corra el servidor. */
const ZONA = 'America/Guatemala';

/** `YYYY-MM-DD` de un instante, en Guatemala. */
export function diaDeGuatemala(instante: Date): string {
  return dayjs(instante).tz(ZONA).format('YYYY-MM-DD');
}

/**
 * Días completos de Guatemala entre las fechas pedidas. Sin fechas es hoy.
 * Devuelve `null` si alguna no es una fecha.
 */
export function rangoDeReporte(
  pedido: { fecha?: string; fechaInicio?: string; fechaFin?: string },
  ahora: Date,
) {
  const hoy = diaDeGuatemala(ahora);
  const soloDia = (valor: string) => valor.split('T')[0];
  const desde = soloDia(pedido.fecha ?? pedido.fechaInicio ?? hoy);
  const hasta = soloDia(
    pedido.fecha ?? pedido.fechaFin ?? pedido.fechaInicio ?? hoy,
  );

  if (![desde, hasta].every((dia) => /^\d{4}-\d{2}-\d{2}$/.test(dia))) {
    return null;
  }

  const start = dayjs.tz(desde, ZONA).startOf('day').toDate();
  const end = dayjs.tz(hasta, ZONA).endOf('day').toDate();
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  return {
    start,
    end,
    label: desde === hasta ? desde : `${desde} al ${hasta}`,
  };
}

/**
 * Excel no tiene zonas horarias y ExcelJS escribe la hora UTC: se le entrega
 * un instante cuya hora UTC es la hora de Guatemala.
 */
export function fechaParaExcel(instante: Date | null): Date | null {
  if (!instante) return null;

  const local = dayjs(instante).tz(ZONA);

  return new Date(
    Date.UTC(
      local.year(),
      local.month(),
      local.date(),
      local.hour(),
      local.minute(),
      local.second(),
    ),
  );
}
