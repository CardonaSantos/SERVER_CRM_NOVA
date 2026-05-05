// src/config/dayjs.config.ts

import dayjs from 'dayjs';

// --- PLUGINS DE ZONA HORARIA Y FECHA ---
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import isoWeek from 'dayjs/plugin/isoWeek'; // <-- AQUÍ ESTÁ EL NUEVO

// --- PLUGINS DE COMPARACIÓN Y FORMATO RELATIVO ---
import relativeTime from 'dayjs/plugin/relativeTime';
import duration from 'dayjs/plugin/duration';
import isBetween from 'dayjs/plugin/isBetween';
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

// --- IDIOMA ---
import 'dayjs/locale/es';

// 1. Cargar Plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isoWeek); // <-- LO CARGAMOS AQUÍ
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// 2. Configurar Locale y Timezone globalmente
dayjs.locale('es');
dayjs.tz.setDefault('America/Guatemala');

// 3. Exportar la instancia configurada
export { dayjs };

// --- HELPERS ÚTILES ---

export const nowGuatemalaISO = () => dayjs().tz('America/Guatemala').format();

export const nowGuatemalaDate = () => dayjs().tz('America/Guatemala').toDate();

export const formatDateGT = (date?: string | Date | dayjs.Dayjs) => {
  return dayjs(date)
    .tz('America/Guatemala')
    .format('DD [de] MMMM [del] YYYY, h:mm A');
};
