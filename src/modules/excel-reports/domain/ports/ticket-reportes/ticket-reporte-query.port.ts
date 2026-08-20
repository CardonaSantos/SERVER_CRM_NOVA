import { TicketReporteEstado } from '../../enums/ticket-report/ticket-report-estado';
import { TicketReportePrioridad } from '../../enums/ticket-report/ticket-reporte-prioridad.enum';
import { TicketReporteRow } from '../../read-models/tickets-reporte/ticket-reporte-row';

/**
 * Parámetros internos ya normalizados para infraestructura.
 *
 * A diferencia de TicketReporteFilters:
 *
 * - las fechas ya son obligatorias;
 * - hastaExclusivo ya representa el límite superior real;
 *
 */
export interface TicketReporteQueryParams {
  /**
   * Inicio inclusivo del período.
   *
   * TicketSoporte.fechaApertura >= desdeInclusivo
   */
  desdeInclusivo: Date;

  /**
   * Fin exclusivo del período.
   *
   * TicketSoporte.fechaApertura < hastaExclusivo
   */
  hastaExclusivo: Date;

  // TICKET

  estados: TicketReporteEstado[];

  prioridades: TicketReportePrioridad[];

  // RELACIONES

  /**
   * Coincide si el ticket posee cualquiera
   * de las etiquetas indicadas.
   *
   * [] = no filtrar por etiqueta.
   */
  etiquetaIds: number[];

  /**
   * Coincide si cualquiera de los IDs participa como:
   *
   * - TicketSoporte.tecnicoId
   * - TicketSoporteTecnico.tecnicoId
   *
   * [] = no filtrar por técnico.
   *
   * La implementación debe devolver cada ticket
   * una sola vez aunque coincida por ambas relaciones.
   */
  tecnicoIds: number[];

  /**
   * null = todos los clientes.
   */
  clienteId: number | null;
}

export interface TicketReporteQueryPort {
  /**
   *
   *
   * 1 TicketSoporte = 1 TicketReporteRow
   *
   * Las relaciones 1:N como:
   *
   * - etiquetas
   * - técnicos adicionales
   * - TicketTimeLog
   *
   * deben consolidarse dentro del TicketReporteRow
   * y nunca multiplicar la cantidad de tickets.
   *
   */
  findRows(params: TicketReporteQueryParams): Promise<TicketReporteRow[]>;
}

export const TICKET_REPORTE_QUERY_PORT = Symbol('TICKET_REPORTE_QUERY_PORT');
