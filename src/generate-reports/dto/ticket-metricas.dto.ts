import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';

export type ModoFechaTicketReport =
  | 'ACTIVIDAD'
  | 'APERTURA'
  | 'CIERRE'
  | 'ACTUALIZACION';

export class QueryTicketsDailyReportDto {
  /**
   * Atajo para reporte de un solo día.
   * Ejemplo: "2026-05-21"
   */
  fecha?: string;

  /**
   * Para rango personalizado.
   */
  fechaInicio?: string;
  fechaFin?: string;

  empresaId?: number;
  tecnicoId?: number;

  estados?: EstadoTicketSoporte[];
  prioridades?: PrioridadTicketSoporte[];

  /**
   * ACTIVIDAD:
   * toma tickets creados, cerrados, resueltos, actualizados,
   * con seguimiento o asignación dentro del rango.
   *
   * Default: ACTIVIDAD
   */
  modoFecha?: ModoFechaTicketReport;
}
