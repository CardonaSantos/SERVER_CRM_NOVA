import {
  Controller,
  Get,
  HttpStatus,
  Logger,
  Post,
  Query,
  RawBodyRequest,
  Req,
  Res,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';
import { Public } from 'src/auth/decoradores/public.decorator';
import {
  firmaMetaValida,
  secretoCoincide,
} from 'src/common/secretos/comparar-secreto';

/** Dirección configurada en Meta: no cambiarla. */
@Controller('whatsapp-meta')
export class WebhookMetaController {
  private readonly logger = new Logger(WebhookMetaController.name);

  constructor(private readonly config: ConfigService) {}

  /** Verificación del webhook que hace Meta. */
  @Get('webhook')
  @Public()
  verificar(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    // Falla cerrado si WHATSAPP_VERIFY_TOKEN no está configurado.
    if (
      mode === 'subscribe' &&
      secretoCoincide(token, this.config.get<string>('WHATSAPP_VERIFY_TOKEN'))
    ) {
      this.logger.log('Webhook de WhatsApp verificado');
      return res.status(HttpStatus.OK).send(challenge);
    }

    // Nunca registrar el token recibido.
    this.logger.warn('Falló la verificación del webhook de WhatsApp');
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  /**
   * Es público pero exige la firma de Meta: X-Hub-Signature-256 =
   * HMAC-SHA256(body crudo, META_APP_SECRET). Los mensajes entrantes se
   * aceptan (200, para que Meta no reintente) pero no se procesan.
   */
  @Post('webhook')
  @Public()
  recibir(@Res() res: Response, @Req() req: RawBodyRequest<Request>) {
    const secreto = this.config.get<string>('META_APP_SECRET');

    if (!secreto) {
      this.logger.error(
        'META_APP_SECRET no está configurado: webhook de Meta rechazado.',
      );
      return res.sendStatus(HttpStatus.FORBIDDEN);
    }

    if (
      !firmaMetaValida(req.rawBody, req.headers['x-hub-signature-256'], secreto)
    ) {
      this.logger.warn('Webhook de Meta rechazado: firma ausente o inválida.');
      return res.sendStatus(HttpStatus.FORBIDDEN);
    }

    return res.sendStatus(HttpStatus.OK);
  }
}
