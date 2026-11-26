import { Public } from 'src/auth/decoradores/public.decorator';
import {
  Controller,
  Get,
  Post,
  Logger,
  Query,
  HttpStatus,
  Res,
  Req,
  RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  firmaMetaValida,
  secretoCoincide,
} from 'src/common/secretos/comparar-secreto';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp-meta')
export class WhatsappApiMetaController {
  private readonly logger = new Logger(WhatsappApiMetaController.name);

  constructor(private readonly config: ConfigService) {}

  /**
   * CONTROLADOR PARA VERIFICACION DE META -> WHATSAPP
   * @param mode
   * @param token
   * @param challenge
   * @param res
   * @returns
   */
  @Get('webhook')
  @Public()
  verifyWebhook(
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
      this.logger.log(' Webhook de WhatsApp verificado correctamente');
      return res.status(HttpStatus.OK).send(challenge);
    }

    // Nunca registrar el token recibido.
    this.logger.warn(` Falló la verificación del webhook: mode=${mode}`);
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  /**
   * Webhook de Meta. Es público (@Public) pero exige la firma de Meta:
   * X-Hub-Signature-256 = HMAC-SHA256(body crudo, META_APP_SECRET).
   * Sin firma válida (o sin META_APP_SECRET configurado) responde 403.
   * Los mensajes entrantes se aceptan (200, para que Meta no reintente) pero
   * todavía no se procesan: la respuesta automática se retiró.
   */
  @Post('webhook')
  @Public()
  handleWebhook(@Res() res: Response, @Req() req: RawBodyRequest<Request>) {
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
