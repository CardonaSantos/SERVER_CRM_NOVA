import {
  Body,
  Controller,
  Headers,
  Injectable,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { WebSocketServices } from './websocket.service';

export interface BroadCastNewMessage {
  event: string;
  data: string;
}

@Controller('internal/server')
export class WebSocketController {
  constructor(private readonly gatewayService: WebSocketServices) {}

  @Post('broadcast')
  // Protege esto con un API Key secreta para que solo tu Bot pueda llamar
  async broadcastEvent(
    @Body() body: BroadCastNewMessage,
    @Headers('x-internal-secret') secret: string,
  ) {
    if (secret !== process.env.INTERNAL_SECRET)
      throw new UnauthorizedException();

    // El CRM emite el evento a la UI conectada
    // body.event podría ser 'whatsapp-message-received'
    // body.data sería el mensaje
    this.gatewayService.emitNewMessageNuvia(body);

    return { ok: true };
  }
}
