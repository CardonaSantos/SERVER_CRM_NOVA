import { Injectable, Logger } from '@nestjs/common';
import { WebSocketServices } from 'src/web-sockets/websocket.service';
import { FacturacionEventosPort } from '../../application/ports/facturacion-eventos.port';

@Injectable()
export class FacturacionEventosWebsocketAdapter
  implements FacturacionEventosPort
{
  private readonly logger = new Logger(FacturacionEventosWebsocketAdapter.name);

  constructor(private readonly sockets: WebSocketServices) {}

  async facturacionCambiada(empresaId: number): Promise<void> {
    try {
      await this.sockets.sendFacturacionEvent(empresaId);
    } catch {
      // El cambio ya está guardado: un fallo aquí no debe hacer reintentarlo.
      this.logger.warn('No se pudo avisar el cambio de facturación.');
    }
  }
}
