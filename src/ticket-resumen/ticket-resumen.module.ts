import { Module } from '@nestjs/common';
import { TicketResumenService } from './app/ticket-resumen.service';
import { TicketResumenController } from './presentation/ticket-resumen.controller';
import { PrismaService } from 'src/prisma/prisma.service';
import { TICKET_RESUMEN_REPOSITORY } from './domain/ticket-resumen.repository';
import { PrismaTicketResumenRepository } from './infraestructura/prisma-ticket-resumen.repository';

@Module({
  controllers: [TicketResumenController],
  providers: [
    TicketResumenService,
    PrismaService,
    {
      provide: TICKET_RESUMEN_REPOSITORY,
      useClass: PrismaTicketResumenRepository,
    },
  ],
  exports: [TicketResumenService],
})
export class TicketResumenModule {}
