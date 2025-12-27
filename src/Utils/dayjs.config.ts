import * as dayjs from 'dayjs';
// --- PLUGINS DE ZONA HORARIA Y FECHA ---
import * as utc from 'dayjs/plugin/utc';
import * as timezone from 'dayjs/plugin/timezone';
// --- PLUGINS DE COMPARACIÓN Y FORMATO RELATIVO ---
import * as relativeTime from 'dayjs/plugin/relativeTime'; // Para .from, .to, .fromNow
import * as duration from 'dayjs/plugin/duration';         // Para manejar lapsos de tiempo (ej. tiempo total trabajado)
import * as isBetween from 'dayjs/plugin/isBetween';       // Para tus filtros de rango de fechas
import * as isSameOrBefore from 'dayjs/plugin/isSameOrBefore'; // Útil para filtros inclusivos
import * as isSameOrAfter from 'dayjs/plugin/isSameOrAfter';

import 'dayjs/locale/es'; // Importar idioma español

// 1. Cargar Plugins
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(relativeTime);
dayjs.extend(duration);
dayjs.extend(isBetween);
dayjs.extend(isSameOrBefore);
dayjs.extend(isSameOrAfter);

// 2. Configurar Locale y Timezone
dayjs.locale('es'); 
dayjs.tz.setDefault("America/Guatemala");
// 1. Cargar los plugins necesarios
// Nota: Al usar "import * as utc", a veces TypeScript encapsula el módulo.
// Si dayjs.extend(utc) te da error, intenta dayjs.extend(utc.default)
dayjs.extend(utc);
dayjs.extend(timezone);

// 2. Configurar idioma global a Español
dayjs.locale('es');
// 3. ESTABLECER LA ZONA HORARIA POR DEFECTO A GUATEMALA
// Esto hace que cualquier llamada a dayjs() intente usar esta zona o permita conversiones fáciles.
dayjs.tz.setDefault("America/Guatemala");
// 4. Exportar la instancia configurada
export { dayjs };

// --- HELPERS ÚTILES (Opcional) ---

/**
 * Obtiene la fecha actual en hora de Guatemala formateada ISO 8601
 * Ideal para guardar en base de datos si usas strings o para logs.
 */
export const nowGuatemalaISO = () => dayjs().tz("America/Guatemala").format();

/**
 * Obtiene la fecha actual en objeto Date nativo de JS, pero ajustado.
 * CUIDADO: El objeto Date de JS siempre imprime en la zona del servidor o UTC.
 */
export const nowGuatemalaDate = () => dayjs().tz("America/Guatemala").toDate();

/**
 * Formato legible para humanos (Ej: "27 de Diciembre del 2025, 10:30 AM")
 */
export const formatDateGT = (date?: string | Date) => {
    return dayjs(date).tz("America/Guatemala").format('DD [de] MMMM [del] YYYY, h:mm A');
}