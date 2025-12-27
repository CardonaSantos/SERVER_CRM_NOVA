import { Module } from '@nestjs/common';
import { TicketsSoporteService } from './app/tickets-soporte.service';
import { TicketsSoporteController } from './presentation/tickets-soporte.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerarMensajeSoporteService } from './generar-mensaje-soporte/generar-mensaje-soporte.service';
import { TwilioService } from 'src/twilio/twilio.service';
import { MetasTicketsService } from 'src/metas-tickets/metas-tickets.service';
import { GatewayModule } from 'src/web-sockets/websocket.module';
import { TICKET_SOPORTE_REPOSITORY } from './domain/ticket-soporte-repository';
import { PrismaTicketSoporteRepository } from './infraestructure/prisma-ticket-soporte';
import { CloudApiMetaModule } from 'src/cloud-api-meta/cloud-api-meta.module';
import { TicketResumenModule } from 'src/ticket-resumen/ticket-resumen.module';

@Module({
  imports: [GatewayModule, CloudApiMetaModule, TicketResumenModule],
  controllers: [TicketsSoporteController],
  providers: [
    TicketsSoporteService,
    PrismaService,
    GenerarMensajeSoporteService,
    TwilioService,
    // CloudApiMetaService,
    MetasTicketsService,
    {
      provide: TICKET_SOPORTE_REPOSITORY,
      useClass: PrismaTicketSoporteRepository,
    },
  ],
  exports: [TicketsSoporteService],
})
export class TicketsSoporteModule {}
