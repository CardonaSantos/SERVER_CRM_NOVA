import * as dayjs from 'dayjs';
import 'dayjs/locale/es';
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import * as customParseFormat from 'dayjs/plugin/customParseFormat';
import { TZ } from './tzgt';
dayjs.extend(customParseFormat);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);
dayjs.locale('es');

type side = 'start' | 'end';
export const formattDateForFilter = (side: side, date?: string | Date) => {
  if (side === 'start') return dayjs(date).tz(TZ).startOf('day').toDate();
  return dayjs(date).tz(TZ).endOf('day').toDate();
};
