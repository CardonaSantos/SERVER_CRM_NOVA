import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TwilioMensajesService } from './twilio-mensajes.service';
import { CreateTwilioMensajeDto } from './dto/create-twilio-mensaje.dto';
import { UpdateTwilioMensajeDto } from './dto/update-twilio-mensaje.dto';

@Controller('twilio-mensajes')
export class TwilioMensajesController {
  constructor(private readonly twilioMensajesService: TwilioMensajesService) {}

  @Get('enviar-promocion-productos')
  async enviarPromocion() {
    // await this.twilioMensajesService.sendPromocion();
  }
}
