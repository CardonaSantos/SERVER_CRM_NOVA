// aqui se usaron los enums
// import {
//   TicketReporteAgrupacion,
//   TicketReporteAgrupacionEfectiva,
// } from '../../enums/ticket-reporte-agrupacion.enum';

// import { TicketReporteEstado } from '../../enums/ticket-reporte-estado.enum';
// import { TicketReportePrioridad } from '../../enums/ticket-reporte-prioridad.enum';

import { TicketReporteEstado } from '../../enums/ticket-report/ticket-report-estado';
import {
  TicketReporteAgrupacion,
  TicketReporteAgrupacionEfectiva,
} from '../../enums/ticket-report/ticket-reporte-agrupacion.enum';
import { TicketReportePrioridad } from '../../enums/ticket-report/ticket-reporte-prioridad.enum';
import { TicketReporteDashboard } from './ticket-reporte-dashboard';
import { TicketReportePeriodoRow } from './ticket-reporte-periodo';
import { TicketReporteRow } from './ticket-reporte-row';
import { TicketReporteTecnicoRow } from './ticket-reporte-tecnico';

export interface TicketReporteMetadata {
  generadoEn: Date;

  /**
   * Rango realmente utilizado.
   *
   * Ambos valores ya están normalizados
   * al horario operativo correspondiente.
   */
  desdeInclusivo: Date;
  hastaExclusivo: Date;

  /**
   * Lo solicitado originalmente.
   */
  agrupacionSolicitada: TicketReporteAgrupacion;

  /**
   * AUTO ya resuelto.
   */
  agrupacionEfectiva: TicketReporteAgrupacionEfectiva;

  /**
   * Filtros efectivos que terminaron aplicándose.
   * Son útiles para imprimirlos en el workbook.
   */
  filtros: {
    estados: TicketReporteEstado[];
    prioridades: TicketReportePrioridad[];

    etiquetaIds: number[];
    tecnicoIds: number[];

    clienteId: number | null;
  };
}

export interface TicketReporteData {
  metadata: TicketReporteMetadata;

  /**
   * 01 Dashboard
   */
  dashboard: TicketReporteDashboard;

  /**
   * 02 Periodo
   */
  periodos: TicketReportePeriodoRow[];

  /**
   * 03 Tecnicos
   */
  tecnicos: TicketReporteTecnicoRow[];

  /**
   * 04 Detalle Tickets
   */
  tickets: TicketReporteRow[];
}
