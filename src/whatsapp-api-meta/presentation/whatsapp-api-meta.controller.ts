import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WhatsappApiMetaService } from '../application/whatsapp-api-meta.service';
import { CreateWhatsappApiMetaDto } from '../dto/create-whatsapp-api-meta.dto';
import { UpdateWhatsappApiMetaDto } from '../dto/update-whatsapp-api-meta.dto';
import { FireworksIaService } from 'src/fireworks-ia/application/fireworks-ia.service';

@Controller('whatsapp-meta')
export class WhatsappApiMetaController {
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
}
