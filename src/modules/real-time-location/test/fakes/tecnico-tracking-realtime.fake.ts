import {
  TecnicoTrackingRealtimePort,
  TecnicoTrackingStateChangedPayload,
} from '../../application/ports/tecnico-tracking-realtime.port';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';
import { UltimaUbicacionReadModel } from '../../domain/read-models/ultima-ubicacion.read-model';

export class TecnicoTrackingRealtimeFake
  implements TecnicoTrackingRealtimePort
{
  readonly ubicaciones: TecnicoTrackingRealtimeView[] = [];
  readonly estados: TecnicoTrackingStateChangedPayload[] = [];
  readonly ultimas: UltimaUbicacionReadModel[] = [];

  emitLocationUpdated(payload: TecnicoTrackingRealtimeView): Promise<void> {
    this.ubicaciones.push(payload);

    return Promise.resolve();
  }

  emitUltimaUbicacion(payload: UltimaUbicacionReadModel): Promise<void> {
    this.ultimas.push(payload);

    return Promise.resolve();
  }

  emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    this.estados.push(payload);

    return Promise.resolve();
  }
}
