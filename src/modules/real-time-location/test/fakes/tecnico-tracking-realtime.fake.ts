import {
  TecnicoTrackingRealtimePort,
  TecnicoTrackingStateChangedPayload,
} from '../../application/ports/tecnico-tracking-realtime.port';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';

export class TecnicoTrackingRealtimeFake
  implements TecnicoTrackingRealtimePort
{
  readonly ubicaciones: TecnicoTrackingRealtimeView[] = [];
  readonly estados: TecnicoTrackingStateChangedPayload[] = [];

  emitLocationUpdated(payload: TecnicoTrackingRealtimeView): Promise<void> {
    this.ubicaciones.push(payload);

    return Promise.resolve();
  }

  emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    this.estados.push(payload);

    return Promise.resolve();
  }
}
