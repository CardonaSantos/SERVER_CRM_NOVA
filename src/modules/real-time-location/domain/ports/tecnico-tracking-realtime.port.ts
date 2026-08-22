import { TecnicoTrackingRealtimeView } from './tecnico-tracking-query.port';

export interface TecnicoTrackingRealtimePort {
  emitLocationUpdated(payload: TecnicoTrackingRealtimeView): Promise<void>;

  emitTrackingStateChanged(payload: TecnicoTrackingRealtimeView): Promise<void>;
}
