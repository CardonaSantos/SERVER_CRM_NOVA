import { dayjs } from 'src/Utils/dayjs.config';

export const formattDateForIntegration = (date: string) => {
  return dayjs(date).tz('America/Guatemala').format('DD/MM/YYYY');
};
