import * as dayjs from 'dayjs';

export function periodoFrom(fecha: Date | string): string {
  return dayjs(fecha).format('YYYYMM'); // «202510»
}
