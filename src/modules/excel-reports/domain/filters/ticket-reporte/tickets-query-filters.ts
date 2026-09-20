import { TicketReporteEstado } from '../../enums/ticket-report/ticket-report-estado';
import { TicketReporteAgrupacion } from '../../enums/ticket-report/ticket-reporte-agrupacion.enum';
import { TicketReportePrioridad } from '../../enums/ticket-report/ticket-reporte-prioridad.enum';

export interface TicketReporteFilters {
  // =====================================================
  // PERÍODO
  // =====================================================

  /**
   * Fecha inicial solicitada para el reporte.
   *
   * Si no se proporciona, el caso de uso utilizará
   * el inicio del mes actual en horario de Guatemala.
   */
  fechaDesde?: Date;

  /**
   * Fecha final solicitada.
   *
   * Representa la fecha calendario seleccionada por
   * el usuario. El caso de uso posteriormente la
   * normalizará a un límite superior exclusivo.
   */
  fechaHasta?: Date;

  /**
   * Forma solicitada de agrupar la evolución temporal.
   *
   * AUTO será resuelto por el caso de uso antes de
   * consultar la infraestructura.
   */
  agrupacion?: TicketReporteAgrupacion;

  // =====================================================
  // TICKET
  // =====================================================

  estados?: TicketReporteEstado[];

  prioridades?: TicketReportePrioridad[];

  // =====================================================
  // RELACIONES
  // =====================================================

  /**
   * Un ticket coincide cuando contiene cualquiera
   * de las etiquetas solicitadas.
   */
  etiquetaIds?: number[];

  /**
   * Un ticket coincide cuando el técnico participa
   * como:
   *
   * - técnico principal
   * - técnico adicional
   *
   * La implementación Prisma deberá realizar la unión
   * sin duplicar el ticket.
   */
  tecnicoIds?: number[];

  clienteId?: number;
}
