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

@Controller('whatsapp-meta')
export class WhatsappApiMetaController {
  private readonly logger = new Logger(WhatsappApiMetaController.name);

  constructor(
    private readonly whatsappApiMetaService: WhatsappApiMetaService,
    private readonly fireworksIa: FireworksIaService,
  ) {}

  @Post('send-test')
  async sentTest(@Body() body: { to: string; message: string }) {
    const reply = await this.fireworksIa.simpleReply(body.message);
    await this.whatsappApiMetaService.sendText(body.to, reply);
    return { ok: true };
  }

  // 1) VERIFICACIÓN DEL WEBHOOK (solo se usa una vez al configurarlo)
  @Get('webhook')
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
    @Res() res: Response,
  ) {
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;

    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      this.logger.log('✅ Webhook de WhatsApp verificado correctamente');
      return res.status(HttpStatus.OK).send(challenge);
    }

    this.logger.warn(
      `❌ Falló la verificación del webhook: mode=${mode}, token=${token}`,
    );
    return res.sendStatus(HttpStatus.FORBIDDEN);
  }

  // 2) MANEJO DE EVENTOS ENTRANTES (mensajes, estados, etc.)
  @Post('webhook')
  async handleWebhook(@Body() body: any, @Res() res: Response) {
    this.logger.debug(`📩 Webhook recibido: ${JSON.stringify(body)}`);

    // WhatsApp Cloud API envía object = "whatsapp_business_account" :contentReference[oaicite:1]{index=1}
    if (body.object !== 'whatsapp_business_account') {
      return res.sendStatus(HttpStatus.OK);
    }

    try {
      for (const entry of body.entry ?? []) {
        for (const change of entry.changes ?? []) {
          const value = change.value;
          const messages = value?.messages;
          const metadata = value?.metadata; // aquí viene el phone_number_id, etc.

          if (!messages || !Array.isArray(messages)) continue;

          for (const message of messages) {
            const from = message.from; // número del cliente
            const type = message.type;

            // Solo atendemos texto por ahora
            if (type === 'text') {
              const text = message.text.body;

              // 👉 Aquí luego podremos guardar en BD el mensaje entrante

              // Llamamos al "cerebro" (OpenAI) para generar respuesta
              // const replyText = await this.openaiChat.generateReply(
              //   from,
              //   text,
              // );

              // // Enviamos la respuesta por WhatsApp
              // await this.whatsappService.sendTextMessage({
              //   to: from,
              //   message: replyText,
              // });

              //  guardar en BD el mensaje de salida también
            }
          }
        }
      }

      return res.sendStatus(HttpStatus.OK);
    } catch (error) {
      this.logger.error('Error manejando webhook de WhatsApp', error);
      return res.sendStatus(HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
