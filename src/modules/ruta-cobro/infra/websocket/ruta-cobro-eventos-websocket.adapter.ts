import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServices } from 'src/web-sockets/websocket.service';
import { RutaCobroEventosPort } from '../../application/ports/ruta-cobro-eventos.port';

@Injectable()
export class RutaCobroEventosWebsocketAdapter implements RutaCobroEventosPort {
  private readonly logger = new Logger(RutaCobroEventosWebsocketAdapter.name);

  constructor(private readonly sockets: WebSocketServices) {}

  async rutaCambiada(empresaId: number, rutaId: number): Promise<void> {
    try {
      await this.sockets.sendRutaCobroEvent({ empresaId, rutaId });
    } catch {
      // El cambio ya está guardado: un fallo aquí no debe hacer reintentarlo.
      this.logger.warn(`No se pudo avisar el cambio de la ruta ${rutaId}.`);
    }
  }
}
