import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';

export type TecnicoTrackingStateChangedPayload = {
  tecnicoId: number;

  sesionTrackingId: number;
  asistenciaId: number;

  estado: EstadoTrackingTecnico;

  iniciadoEn: Date;

  finalizadoEn: Date | null;

  ultimoHeartbeatEn: Date;
};

export const TECNICO_TRACKING_REALTIME = Symbol('TECNICO_TRACKING_REALTIME');

export interface TecnicoTrackingRealtimePort {
  /**
   * Actualización enriquecida del mapa.
   */
  emitLocationUpdated(payload: TecnicoTrackingRealtimeView): Promise<void>;

  /**
   * Cambio de ciclo de vida:
   *
   * ACTIVA
   * FINALIZADA
   * EXPIRADA
   */
  emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void>;
}
