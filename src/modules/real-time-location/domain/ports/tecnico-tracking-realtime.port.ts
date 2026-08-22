import { EstadoTrackingTecnico } from '../enums/estado-tracking-tecnico.enum';

import { TecnicoTrackingRealtimeView } from './tecnico-tracking-query.port';

export type TecnicoTrackingStateChangedPayload = {
  tecnicoId: number;

  sesionTrackingId: number;
  asistenciaId: number;

  estado: EstadoTrackingTecnico;

  iniciadoEn: Date;

  finalizadoEn: Date | null;

  ultimoHeartbeatEn: Date;
};

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
