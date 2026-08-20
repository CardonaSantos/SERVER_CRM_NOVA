export interface TicketReporteTecnicoRow {
  tecnicoId: number;
  tecnicoNombre: string;

  // =====================================================
  // PARTICIPACIÓN
  // =====================================================

  /**
   * Cantidad de tickets distintos en los que participó.
   *
   * Un ticket se cuenta máximo una vez por técnico.
   */
  totalParticipaciones: number;

  /**
   * Tickets donde era TicketSoporte.tecnicoId.
   */
  comoPrincipal: number;

  /**
   * Tickets donde estaba en TicketSoporteTecnico.
   */
  comoApoyo: number;

  // =====================================================
  // RESULTADO DE LOS TICKETS PARTICIPADOS
  // =====================================================

  ticketsFinalizados: number;

  ticketsPendientes: number;

  ticketsUrgentes: number;

  // =====================================================
  // TIEMPOS DE LOS TICKETS EN QUE PARTICIPÓ
  // =====================================================

  /**
   * Promedio de tiempo hasta primera asignación
   * de los tickets en los que participó.
   */
  promedioHastaAsignacionMinutos: number | null;

  /**
   * Promedio de tiempo hasta primera atención
   * de los tickets en los que participó.
   */
  promedioHastaPrimeraAtencionMinutos: number | null;

  /**
   * Promedio del tiempo técnico registrado
   * DE LOS TICKETS en los que participó.
   *
   * No representa tiempo individual del técnico.
   */
  promedioTiempoTecnicoTicketsMinutos: number | null;

  /**
   * Promedio del tiempo calendario total
   * DE LOS TICKETS en los que participó.
   */
  promedioTiempoTotalTicketsMinutos: number | null;

  ticketsConResolucionTecnica: number;

  promedioResolucionTecnicaTicketsMinutos: number | null;
}
