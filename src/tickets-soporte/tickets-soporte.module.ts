import { Module } from '@nestjs/common';
import { TicketsSoporteService } from './tickets-soporte.service';
import { TicketsSoporteController } from './tickets-soporte.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TicketsSoporteController],
  providers: [TicketsSoporteService, PrismaService],
})
export class TicketsSoporteModule {}
