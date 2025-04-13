import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { TwilioService } from './twilio.service';
import { CreateTwilioDto } from './dto/create-twilio.dto';
import { UpdateTwilioDto } from './dto/update-twilio.dto';

@Controller('twilio')
export class TwilioController {
  constructor(private readonly twilioService: TwilioService) {}

  @Post('send')
  async sendMessage(@Body() body: { to: string; message: string }) {
    return this.twilioService.sendWhatsApp(body.to, body.message);
  }
}
