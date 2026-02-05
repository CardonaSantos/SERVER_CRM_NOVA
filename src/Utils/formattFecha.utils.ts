const zona = 'America/Guatemala';
import 'dayjs/locale/es';
import 'dayjs/locale/es'; // Importar la localización en español
import 'dayjs/locale/es'; // importa el paquete de idioma
import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

dayjs.locale('es');

export const formattShortFecha = (value: string | Date): string => {
  return dayjs(value).tz(zona).format('DD/MM/YYYY');
};

export const formattFechaWithMinutes = (value: string | Date): string => {
  return dayjs(value).tz(zona).format('DD/MM/YYYY hh:mm a');
};
