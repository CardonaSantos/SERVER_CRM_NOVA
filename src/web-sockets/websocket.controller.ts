import {
  Body,
  Controller,
  Headers,
  Post,
  UnauthorizedException,
  Logger, // Opcional: para loguear si falta la config
} from '@nestjs/common';
import { WebSocketServices } from './websocket.service';
import { ConfigService } from '@nestjs/config';

// Nota: data suele ser un objeto JSON, no string, a menos que lo envíes stringify manualmente dos veces.
// Te sugiero usar 'any' o un genérico aquí si mandas objetos.
export interface BroadCastNewMessage {
  event: string;
  data: any;
}

@Controller('internal/server')
export class WebSocketController {
  private readonly logger = new Logger(WebSocketController.name);

  constructor(
    private readonly gatewayService: WebSocketServices,
    private readonly config: ConfigService,
  ) {}

  @Post('broadcast')
  async broadcastEvent(
    @Body() body: BroadCastNewMessage,
    @Headers('x-internal-secret') secret: string,
  ) {
    const configSecret = this.config.get<string>('INTERNAL_SECRET');

    // 1. Seguridad: Si el servidor no tiene configurada la clave, bloqueamos todo por precaución.
    if (!configSecret) {
      this.logger.error(
        'CRITICAL: INTERNAL_SECRET no está configurado en el .env',
      );
      throw new UnauthorizedException('Server misconfiguration');
    }

    // 2. Comparación
    if (secret !== configSecret) {
      throw new UnauthorizedException();
    }

    // 3. Emitir
    this.gatewayService.emitNewMessageNuvia(body);

    return { ok: true };
  }
}
