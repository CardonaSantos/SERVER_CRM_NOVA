import { dayjs } from 'src/Utils/dayjs.config';

export function periodoFrom(fecha: Date | string): string {
  return dayjs(fecha).format('YYYYMM'); // «202510»
}
