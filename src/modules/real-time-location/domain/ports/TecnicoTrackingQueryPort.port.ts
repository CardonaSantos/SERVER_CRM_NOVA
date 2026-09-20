import {
  TecnicoTrackingAsistenciaDetalle,
  TecnicoTrackingHistorialFilters,
  TecnicoTrackingHistorialPaginatedResult,
  TecnicoTrackingRealtimeView,
  TecnicoTrackingUbicacionesFilters,
  TecnicoTrackingUbicacionesPaginatedResult,
} from './tecnico-tracking-query.port';

export interface TecnicoTrackingQueryPort {
  findAttendanceHistory(
    filters: TecnicoTrackingHistorialFilters,
  ): Promise<TecnicoTrackingHistorialPaginatedResult>;

  findAttendanceDetail(params: {
    asistenciaId: number;
  }): Promise<TecnicoTrackingAsistenciaDetalle | null>;

  findAttendanceLocations(
    filters: TecnicoTrackingUbicacionesFilters,
  ): Promise<TecnicoTrackingUbicacionesPaginatedResult>;

  /**
   * Construye la vista operacional enriquecida
   * de un técnico con tracking activo.
   *
   * Utilizada principalmente por los eventos realtime
   * posteriores a un heartbeat/GPS.
   */
  findRealtimeViewByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingRealtimeView | null>;

  /**
   * Snapshot operacional de todos los técnicos
   * que actualmente poseen una sesión de tracking ACTIVA.
   *
   * Es la fuente HTTP inicial para los mapas realtime.
   * Después de este snapshot, Socket.IO mantiene
   * la información actualizada incrementalmente.
   */
  findActiveRealtimeViews(): Promise<TecnicoTrackingRealtimeView[]>;
}
