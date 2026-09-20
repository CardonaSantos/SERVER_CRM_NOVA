// aqui se usaron los enums

import { TicketReporteEstado } from '../../enums/ticket-report/ticket-report-estado';
import { TicketReportePrioridad } from '../../enums/ticket-report/ticket-reporte-prioridad.enum';

export interface TicketReporteCantidadPorCategoria<T extends string = string> {
  categoria: T;
  total: number;
}

export interface TicketReporteEtiquetaResumen {
  etiquetaId: number;
  etiqueta: string;

  totalTickets: number;
}

export interface TicketReporteClienteResumen {
  clienteId: number;

  cliente: string;

  totalTickets: number;
}

export interface TicketReporteDashboard {
  // =====================================================
  // VOLUMEN
  // =====================================================

  totalTickets: number;

  /**
   * Tickets actualmente RESUELTA o CERRADO
   * dentro del universo seleccionado.
   */
  totalFinalizados: number;

  /**
   * Tickets del universo que aún no están
   * RESUELTA/CERRADO/CANCELADA/ARCHIVADA.
   */
  totalPendientes: number;

  /**
   * Tickets sin ningún participante técnico.
   */
  totalSinTecnico: number;

  // =====================================================
  // DISTRIBUCIONES
  // =====================================================

  porEstado: Array<TicketReporteCantidadPorCategoria<TicketReporteEstado>>;

  porPrioridad: Array<
    TicketReporteCantidadPorCategoria<TicketReportePrioridad>
  >;

  topEtiquetas: TicketReporteEtiquetaResumen[];

  /**
   * Top 10 de clientes con mayor cantidad de tickets
   * dentro del universo seleccionado del reporte.
   *
   * Se excluyen tickets sin cliente asociado.
   */
  topClientes: TicketReporteClienteResumen[];

  // =====================================================
  // TIEMPOS
  // =====================================================

  tiempos: {
    /**
     * fechaApertura -> primera asignación.
     */
    promedioHastaAsignacionMinutos: number | null;

    /**
     * Cantidad de tickets que realmente poseen
     * fechaAsignacion y por tanto participan
     * en el promedio anterior.
     */
    muestrasHastaAsignacion: number;

    /**
     * fechaApertura -> primera atención.
     */
    promedioHastaPrimeraAtencionMinutos: number | null;

    muestrasHastaPrimeraAtencion: number;

    /**
     * fechaApertura -> resolución técnica.
     */
    promedioHastaResolucionTecnicaMinutos: number | null;

    muestrasHastaResolucionTecnica: number;

    /**
     * SUM(TicketTimeLog.duracionMinutos)
     * únicamente sobre tickets que poseen
     * telemetría técnica consolidada.
     */
    promedioTiempoTecnicoRegistradoMinutos: number | null;

    muestrasTiempoTecnicoRegistrado: number;

    /**
     * fechaApertura -> fechaCierre.
     */
    promedioTiempoTotalMinutos: number | null;

    muestrasTiempoTotal: number;
  };
}
