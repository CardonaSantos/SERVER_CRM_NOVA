/**
 * Horario en que un trabajo automático puede llegar a los clientes (decisión
 * C19 de la guía de cobranza): de 10:00 a 18:00 de Guatemala, todos los días.
 * Fuera de él solo corren tareas que no tocan clientes.
 */
export const HORA_INICIO_VENTANA = 10;

/** La ventana cierra a esta hora en punto (18:00 ya está fuera). */
export const HORA_FIN_VENTANA = 18;

const ZONA_HORARIA = 'America/Guatemala';

const FORMATO_HORA = new Intl.DateTimeFormat('en-GB', {
  timeZone: ZONA_HORARIA,
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

/** Hora y minuto de Guatemala de un instante. */
export function horaGuatemala(instante: Date): {
  hora: number;
  minuto: number;
} {
  const partes = FORMATO_HORA.formatToParts(instante);
  const valor = (tipo: 'hour' | 'minute') =>
    Number(partes.find((parte) => parte.type === tipo)?.value);
  return { hora: valor('hour'), minuto: valor('minute') };
}

export function dentroDeVentanaClientes(instante: Date): boolean {
  const { hora } = horaGuatemala(instante);
  return hora >= HORA_INICIO_VENTANA && hora < HORA_FIN_VENTANA;
}
