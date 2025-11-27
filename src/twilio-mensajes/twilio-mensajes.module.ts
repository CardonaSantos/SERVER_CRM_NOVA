import { Module } from '@nestjs/common';
import { TwilioMensajesService } from './twilio-mensajes.service';
import { TwilioMensajesController } from './twilio-mensajes.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TwilioService } from 'src/twilio/twilio.service';

@Module({
  controllers: [TwilioMensajesController],
  providers: [TwilioMensajesService, PrismaService, TwilioService],
})
export class TwilioMensajesModule {}
