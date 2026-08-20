export interface TicketReportePeriodoRow {
  /**
   * Clave estable para el bucket.
   *
   * Ejemplos:
   * 2026-08-20
   * 2026-W34
   * 2026-08
   */
  periodo: string;

  /**
   * Texto amigable para Excel.
   */
  etiqueta: string;

  desde: Date;
  hastaExclusivo: Date;

  // =====================================================
  // VOLUMEN
  // =====================================================

  /**
   * Tickets cuya fechaApertura pertenece
   * a este bucket.
   */
  totalTickets: number;

  totalFinalizados: number;

  totalPendientes: number;

  totalUrgentes: number;

  // =====================================================
  // TIEMPOS
  // =====================================================

  promedioHastaAsignacionMinutos: number | null;

  promedioHastaPrimeraAtencionMinutos: number | null;

  promedioHastaResolucionTecnicaMinutos: number | null;

  promedioTiempoTecnicoRegistradoMinutos: number | null;

  promedioTiempoTotalMinutos: number | null;
}
