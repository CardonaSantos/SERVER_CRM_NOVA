import { TecnicoMetrica } from './meta-ticket.read-model';

/** Ticket en fase resuelta, con los días ya en hora de Guatemala. */
export type TicketResueltoReadModel = {
  id: number;
  /** Principal y apoyos, sin repetir. */
  tecnicoIds: number[];
  diaCierre: string;
};

/** Ticket (no cancelado) abierto o resuelto dentro de un periodo. */
export type TicketPeriodoReadModel = {
  id: number;
  tecnicoIds: number[];
  diaApertura: string;
  /** Solo si está resuelto. */
  diaCierre: string | null;
  /** De la apertura al cierre; solo si está resuelto. */
  horasHastaCierre: number | null;
};

/** Cómo están los tickets en este momento. */
export type SituacionTickets = {
  activos: number;
  enProceso: number;
  resueltosHoy: number;
  /** Abiertos hoy que ya tienen técnico. */
  asignadosHoy: number;
};

export type RendimientoTecnico = {
  tecnico: TecnicoMetrica;
  totalTickets: number;
  resueltos: number;
  pendientes: number;
  /** Porcentaje con un decimal. */
  tasaResolucion: number;
  horasPromedio: number | null;
  resueltosPorDia: number;
  proyeccion: number;
};

export type ResueltosDia = {
  fecha: string;
  /** Tickets distintos: uno con dos técnicos cuenta una vez. */
  total: number;
  porTecnico: { tecnicoId: number; resueltos: number }[];
};
