import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  TecnicoTrackingAsistenciaDetalle,
  TecnicoTrackingHistorialFilters,
  TecnicoTrackingHistorialListItem,
  TecnicoTrackingRealtimeView,
  TecnicoTrackingUbicacionesFilters,
  TecnicoTrackingUbicacionListItem,
} from '../read-models/tecnico-tracking.read-model';

export const TECNICO_TRACKING_QUERY = Symbol('TECNICO_TRACKING_QUERY');

export interface TecnicoTrackingQueryPort {
  findAttendanceHistory(
    filters: TecnicoTrackingHistorialFilters,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TecnicoTrackingHistorialListItem>>;

  findAttendanceDetail(params: {
    asistenciaId: number;
  }): Promise<TecnicoTrackingAsistenciaDetalle | null>;

  findAttendanceLocations(
    filters: TecnicoTrackingUbicacionesFilters,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TecnicoTrackingUbicacionListItem>>;

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
