import { PrioridadTicket } from '../../../ticket-soporte/public/ticket-soporte.types';
import { Granularidad } from '../enums/granularidad.enum';
import { PresetActividad } from '../enums/preset-actividad.enum';

export type ConteoPorPrioridad = Record<PrioridadTicket, number>;

export type TicketCreado = {
  /** Fecha de negocio de apertura. */
  fecha: string;
  fechaApertura: Date;
  prioridad: PrioridadTicket;
};

export type TicketResuelto = {
  /** Fecha de negocio del cierre. */
  fecha: string;
  prioridad: PrioridadTicket;
  fechaApertura: Date;
  fechaInicioAtencion: Date | null;
  /** Cuando terminó el técnico; sin ese dato, el cierre. */
  finTrabajo: Date;
};

export type TicketPendiente = {
  prioridad: PrioridadTicket;
  fechaApertura: Date;
};

export type PuntoActividadTickets = {
  periodo: string;
  creados: number;
  resueltos: number;
  prioridades: {
    creados: ConteoPorPrioridad;
    resueltos: ConteoPorPrioridad;
  };
};

export type Comparacion = {
  actual: number;
  anterior: number;
  variacionPorcentaje: number | null;
};

export type ActividadTicketsReadModel = {
  periodo: {
    preset: PresetActividad;
    desde: string;
    hasta: string;
    granularidad: Granularidad;
    puntos: number;
  };
  resumen: {
    creados: number;
    resueltos: number;
    pendientesActuales: number;
    urgentesPendientes: number;
    altosPendientes: number;
    pendientesMas48Horas: number;
  };
  tiempos: {
    promedioResolucionMinutos: number | null;
    promedioPrimeraAtencionMinutos: number | null;
  };
  prioridades: {
    creadosPeriodo: ConteoPorPrioridad;
    resueltosPeriodo: ConteoPorPrioridad;
    pendientesActuales: ConteoPorPrioridad;
  };
  comparativa: {
    periodoAnterior: { desde: string; hasta: string };
    creados: Comparacion;
    resueltos: Comparacion;
  } | null;
  actividad: PuntoActividadTickets[];
};
