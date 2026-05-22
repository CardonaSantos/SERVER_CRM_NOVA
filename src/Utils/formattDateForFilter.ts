import { dayjs } from 'src/Utils/dayjs.config';

import { TZ } from './tzgt';

type side = 'start' | 'end';
export const formattDateForFilter = (side: side, date?: string | Date) => {
  if (side === 'start') return dayjs(date).tz(TZ).startOf('day').toDate();
  return dayjs(date).tz(TZ).endOf('day').toDate();
};
