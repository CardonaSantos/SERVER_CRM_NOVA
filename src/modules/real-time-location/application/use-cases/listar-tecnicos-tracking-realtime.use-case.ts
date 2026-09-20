import { Inject, Injectable } from '@nestjs/common';

import { TecnicoTrackingRealtimeView } from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';

import { TECNICO_TRACKING_QUERY } from '../../infra/tokens/tokens';

/**
 * Obtiene el snapshot operacional actual de los técnicos
 * que poseen una sesión de tracking ACTIVA.
 *
 * Este snapshot es la fuente HTTP inicial para los mapas.
 *
 * Después de cargarlo, Socket.IO mantiene la vista
 * actualizada mediante:
 *
 * tracking:location-updated
 * tracking:state-changed
 */
@Injectable()
export class ListarTecnicosTrackingRealtimeUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly trackingQuery: TecnicoTrackingQueryPort,
  ) {}

  async execute(): Promise<TecnicoTrackingRealtimeView[]> {
    return this.trackingQuery.findActiveRealtimeViews();
  }
}
