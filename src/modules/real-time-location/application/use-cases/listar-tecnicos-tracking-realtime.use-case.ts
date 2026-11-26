import { Inject, Injectable } from '@nestjs/common';
import {
  TECNICO_TRACKING_QUERY,
  TecnicoTrackingQueryPort,
} from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingRealtimeView } from '../../domain/read-models/tecnico-tracking.read-model';

/**
 * Snapshot de los técnicos con una sesión de tracking ACTIVA: la fuente HTTP
 * inicial de los mapas. Después Socket.IO la mantiene al día con
 * `tracking:location-updated` y `tracking:state-changed`.
 */
@Injectable()
export class ListarTecnicosTrackingRealtimeUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly consulta: TecnicoTrackingQueryPort,
  ) {}

  execute(): Promise<TecnicoTrackingRealtimeView[]> {
    return this.consulta.findActiveRealtimeViews();
  }
}
