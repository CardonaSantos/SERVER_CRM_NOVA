import { EstadoMetaTicket } from '../../domain/enums/estado-meta-ticket.enum';

export class TecnicoMetricaResponseDto {
  /** Id del usuario */
  id: number;
  /** Nombre */
  nombre: string;
  /** Si el usuario sigue activo */
  activo: boolean;
}

export class MetaTicketResponseDto {
  /** Id de la meta */
  id: number;
  /** Nombre de la meta */
  titulo: string | null;
  /** A quién se le fijó */
  tecnico: TecnicoMetricaResponseDto;
  /** Primer día (YYYY-MM-DD) */
  fechaInicio: string;
  /** Último día, incluido (YYYY-MM-DD) */
  fechaFin: string;
  /** Tickets a resolver */
  objetivo: number;
  /** Tickets resueltos entre las fechas, como principal o apoyo */
  avance: number;
  /** Cuántos faltan */
  faltantes: number;
  /** Avance sobre el objetivo; puede pasar de 100 */
  porcentaje: number;
  /** Estado calculado */
  estado: EstadoMetaTicket;
  /** Días que dura */
  diasTotales: number;
  /** Días transcurridos, contando hoy */
  diasTranscurridos: number;
  /** Tickets que se alcanzarían al ritmo actual */
  proyeccion: number;
  /** ISO 8601 */
  creadaEn: string;
  /** ISO 8601 */
  actualizadaEn: string;
}
