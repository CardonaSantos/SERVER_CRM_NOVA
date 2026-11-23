import { Body, Controller, Post } from '@nestjs/common';
import { WebSocketServices } from './websocket.service';
import { RequiereSecretoInterno } from 'src/common/secretos/secreto-interno.guard';

export interface BroadCastNewMessage {
  event: string;
  data: any;
}

@Controller('internal/server')
export class WebSocketController {
  constructor(private readonly gatewayService: WebSocketServices) {}

  /**
   * Integración servidor a servidor (Nuvia): sin JWT, autenticada con
   * x-internal-secret en un guard (falla cerrado si INTERNAL_SECRET no está
   * configurado). El body es una interfaz a propósito: lo envía otro
   * servidor y no se valida para no romperlo.
   */
  @Post('broadcast')
  @RequiereSecretoInterno()
  broadcastEvent(@Body() body: BroadCastNewMessage) {
    this.gatewayService.emitNewMessageNuvia(body);

    return { ok: true };
  }
}
