import { TicketReporteEstado } from '../../enums/ticket-report/ticket-report-estado';
import { TicketReportePrioridad } from '../../enums/ticket-report/ticket-reporte-prioridad.enum';

// aqui se usaron los enums
export interface TicketReporteParticipante {
  tecnicoId: number;
  nombre: string;

  /**
   * PRINCIPAL:
   * TicketSoporte.tecnicoId
   *
   * APOYO:
   * TicketSoporteTecnico
   */
  tipo: 'PRINCIPAL' | 'APOYO';
}

export interface TicketReporteEtiqueta {
  id: number;
  nombre: string;
}

export interface TicketReporteRow {
  // =====================================================
  // IDENTIDAD
  // =====================================================

  ticketId: number;

  titulo: string | null;
  descripcion: string | null;

  estado: TicketReporteEstado;
  prioridad: TicketReportePrioridad;

  // =====================================================
  // CLIENTE
  // =====================================================

  clienteId: number | null;
  clienteNombre: string | null;

  // =====================================================
  // CREADOR
  // =====================================================

  creadoPorId: number | null;
  creadoPorNombre: string | null;

  // =====================================================
  // TÉCNICOS
  // =====================================================

  tecnicoPrincipalId: number | null;
  tecnicoPrincipalNombre: string | null;

  /**
   * Técnicos del pivote TicketSoporteTecnico.
   *
   * No debe contener nuevamente al técnico principal.
   */
  tecnicosApoyo: TicketReporteParticipante[];

  /**
   * Unión deduplicada:
   *
   * TicketSoporte.tecnicoId
   * UNION
   * TicketSoporteTecnico.tecnicoId
   */
  participantes: TicketReporteParticipante[];

  totalParticipantes: number;

  // =====================================================
  // ETIQUETAS
  // =====================================================

  etiquetas: TicketReporteEtiqueta[];

  // =====================================================
  // CICLO DEL TICKET
  // =====================================================

  fechaApertura: Date;

  fechaAsignacion: Date | null;

  fechaInicioAtencion: Date | null;

  fechaResolucionTecnico: Date | null;

  fechaCierre: Date | null;

  // =====================================================
  // MÉTRICAS TEMPORALES DERIVADAS
  // =====================================================

  /**
   * fechaApertura -> fechaAsignacion
   */
  tiempoHastaAsignacionMinutos: number | null;

  /**
   * fechaApertura -> fechaInicioAtencion
   */
  tiempoHastaPrimeraAtencionMinutos: number | null;

  /**
   * fechaApertura -> fechaResolucionTecnico
   */
  tiempoHastaResolucionTecnicaMinutos: number | null;

  /**
   * SUM(TicketTimeLog.duracionMinutos)
   * de los ciclos que poseen una duración consolidada.
   *
   * null significa que no existe todavía telemetría
   * técnica medible para este ticket.
   *
   * Ejemplos:
   *
   * - sin TicketTimeLog            -> null
   * - log abierto sin duración     -> null
   * - log cerrado con 0 minutos    -> 0
   * - logs de 20 y 35 minutos      -> 55
   *
   * Es tiempo técnico registrado DEL TICKET,
   * no tiempo atribuible individualmente a un técnico.
   */
  tiempoTecnicoRegistradoMinutos: number | null;
  /**
   * fechaApertura -> fechaCierre.
   *
   * Se deriva directamente de las fechas del ticket
   * para mantener una semántica uniforme incluso
   * frente a resúmenes históricos legacy.
   */
  tiempoTotalMinutos: number | null;

  /**
   * Número de ciclos técnicos registrados.
   */
  ciclosTecnicos: number;

  // =====================================================
  // RESOLUCIÓN
  // =====================================================

  solucionId: number | null;
  solucionNombre: string | null;

  resueltoComo: string | null;

  notasInternas: string | null;
}
