import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Logger,
  Query,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { WhatsappApiMetaService } from '../application/whatsapp-api-meta.service';
import { CreateWhatsappApiMetaDto } from '../dto/create-whatsapp-api-meta.dto';
import { UpdateWhatsappApiMetaDto } from '../dto/update-whatsapp-api-meta.dto';
import { FireworksIaService } from 'src/fireworks-ia/application/fireworks-ia.service';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';

@Controller('whatsapp-meta')
export class WhatsappApiMetaController {
  private readonly logger = new Logger(WhatsappApiMetaController.name);

  constructor(
    private readonly whatsappApiMetaService: WhatsappApiMetaService,
    private readonly fireworksIa: FireworksIaService,
    private readonly config: ConfigService,
  ) {}

  /**
   * El modelo de IA cerebro responde, prueba
   * @param body
   * @returns
   */
  @Post('send-test')
  async sentTest(@Body() body: { to: string; message: string }) {
    const reply = await this.fireworksIa.simpleReply(body.message);
    await this.whatsappApiMetaService.sendText(body.to, reply);
    return { ok: true };
  }

  /**
   * CONTROLADOR PARA VERIFICACION DE META -> WHATSAPP
   * @param mode
   * @param token
   * @param challenge
   * @param res
   * @returns
   */
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = this.config.get<string>('WHATSAPP_VERIFY_TOKEN');
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log(' Webhook de WhatsApp verificado correctamente');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn(
      ` Falló la verificación del webhook: mode=${mode}, token=${token}`,
    );
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.debug(`📩 Webhook recibido: ${JSON.stringify(body)}`);

    // WhatsApp Cloud API suele enviar object = "whatsapp_business_account"
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(HttpStatus.OK);
    }

    try {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          const messages = value?.messages;

          if (!messages || !Array.isArray(messages)) continue;

          for (const message of messages) {
            const from = message.from; // número del cliente
            const type = message.type;

            // Por ahora solo texto
            if (type === 'text') {
              const text = message.text?.body ?? '';

              //  guardaremos el mensaje en BD

              // 1) Pedimos respuesta al “cerebro”
              const reply = await this.fireworksIa.simpleReply(text);

              // 2) Enviamos respuesta por WhatsApp al mismo número
              await this.whatsappApiMetaService.sendText(from, reply);

              // guardaremos la respuesta en BD también
            }
          }
        }
      }

      return res.sendStatus(HttpStatus.OK); // siempre responde 200 rápido
    } catch (error) {
      this.logger.error('Error manejando webhook de WhatsApp', error as any);
      return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
