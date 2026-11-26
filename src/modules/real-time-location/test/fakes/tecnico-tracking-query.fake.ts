import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import { TecnicoTrackingQueryPort } from '../../domain/ports/tecnico-tracking-query.port';
import {
  TecnicoTrackingAsistenciaDetalle,
  TecnicoTrackingHistorialFilters,
  TecnicoTrackingHistorialListItem,
  TecnicoTrackingRealtimeView,
  TecnicoTrackingUbicacionesFilters,
  TecnicoTrackingUbicacionListItem,
} from '../../domain/read-models/tecnico-tracking.read-model';

export class TecnicoTrackingQueryFake implements TecnicoTrackingQueryPort {
  vistaRealtime: TecnicoTrackingRealtimeView | null = null;
  vistasActivas: TecnicoTrackingRealtimeView[] = [];
  detalle: TecnicoTrackingAsistenciaDetalle | null = null;

  /** Si se asigna, `findRealtimeViewByTechnician` falla con este error. */
  fallaVistaRealtime: Error | null = null;

  filtrosHistorial: TecnicoTrackingHistorialFilters | null = null;
  paginacionHistorial: Paginacion | null = null;
  filtrosUbicaciones: TecnicoTrackingUbicacionesFilters | null = null;
  paginacionUbicaciones: Paginacion | null = null;

  findAttendanceHistory(
    filters: TecnicoTrackingHistorialFilters,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TecnicoTrackingHistorialListItem>> {
    this.filtrosHistorial = filters;
    this.paginacionHistorial = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }

  findAttendanceDetail(): Promise<TecnicoTrackingAsistenciaDetalle | null> {
    return Promise.resolve(this.detalle);
  }

  findAttendanceLocations(
    filters: TecnicoTrackingUbicacionesFilters,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<TecnicoTrackingUbicacionListItem>> {
    this.filtrosUbicaciones = filters;
    this.paginacionUbicaciones = paginacion;

    return Promise.resolve({ items: [], total: 0, ...paginacion });
  }

  findRealtimeViewByTechnician(): Promise<TecnicoTrackingRealtimeView | null> {
    if (this.fallaVistaRealtime) return Promise.reject(this.fallaVistaRealtime);

    return Promise.resolve(this.vistaRealtime);
  }

  findActiveRealtimeViews(): Promise<TecnicoTrackingRealtimeView[]> {
    return Promise.resolve(this.vistasActivas);
  }
}
