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
   * utilizada por Socket y eventualmente por
   * consultas del mapa actual.
   */
  findRealtimeViewByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingRealtimeView | null>;
}
