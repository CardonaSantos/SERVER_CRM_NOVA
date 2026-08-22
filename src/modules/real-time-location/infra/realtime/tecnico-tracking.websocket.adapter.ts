import { Injectable, Logger } from '@nestjs/common';

import { WebSocketServices } from 'src/web-sockets/websocket.service';

import {
  TecnicoTrackingRealtimePort,
  TecnicoTrackingStateChangedPayload,
} from '../../domain/ports/tecnico-tracking-realtime.port';

import { TecnicoTrackingRealtimeView } from '../../domain/ports/tecnico-tracking-query.port';

@Injectable()
export class TecnicoTrackingWebSocketAdapter
  implements TecnicoTrackingRealtimePort
{
  private readonly logger = new Logger(TecnicoTrackingWebSocketAdapter.name);

  constructor(private readonly webSocket: WebSocketServices) {}

  async emitLocationUpdated(
    payload: TecnicoTrackingRealtimeView,
  ): Promise<void> {
    try {
      await this.webSocket.emitTecnicoTrackingLocation(payload);
    } catch (error) {
      /*
       * El Socket es secundario.
       *
       * Una ubicación ya persistida NO debe
       * considerarse fallida solo porque la
       * emisión realtime falló.
       */
      this.logger.error(
        'No fue posible emitir la ubicación realtime del técnico.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async emitTrackingStateChanged(
    payload: TecnicoTrackingStateChangedPayload,
  ): Promise<void> {
    try {
      await this.webSocket.emitTecnicoTrackingStateChanged(payload);
    } catch (error) {
      this.logger.error(
        'No fue posible emitir el cambio de estado del tracking.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
