import { RangoFechas } from '../policies/calendario.policy';
import {
  TicketCreado,
  TicketPendiente,
  TicketResuelto,
} from '../read-models/actividad-tickets.read-model';

export const ACTIVIDAD_TICKETS_QUERY = Symbol('ACTIVIDAD_TICKETS_QUERY');

export interface ActividadTicketsQueryPort {
  /** Fecha de negocio de la primera apertura. */
  findPrimeraApertura(): Promise<string | null>;
  findCreados(rango: RangoFechas): Promise<TicketCreado[]>;
  /** Resueltos hoy cuyo cierre cae en el rango. */
  findResueltos(rango: RangoFechas): Promise<TicketResuelto[]>;
  /** Abiertos, en proceso y en revisión, sin importar la fecha. */
  findPendientes(): Promise<TicketPendiente[]>;
}
