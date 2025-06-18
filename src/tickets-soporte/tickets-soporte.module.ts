import { Module } from '@nestjs/common';
import { TicketsSoporteService } from './tickets-soporte.service';
import { TicketsSoporteController } from './tickets-soporte.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerarMensajeSoporteService } from './generar-mensaje-soporte/generar-mensaje-soporte.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { MetasTicketsService } from 'src/metas-tickets/metas-tickets.service';

@Module({
  controllers: [TicketsSoporteController],
  providers: [
    TicketsSoporteService,
    PrismaService,
    GenerarMensajeSoporteService,
    TwilioService,
    MetasTicketsService,
  ],
})
export class TicketsSoporteModule {}
