const zona = 'America/Guatemala';
import { dayjs } from 'src/Utils/dayjs.config';

export const formattShortFecha = (value: string | Date): string => {
  return dayjs(value).tz(zona).format('DD/MM/YYYY');
};

export const formattFechaWithMinutes = (value: string | Date): string => {
  return dayjs(value).tz(zona).format('DD/MM/YYYY hh:mm a');
};
