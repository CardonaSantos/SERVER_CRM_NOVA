import { Module } from '@nestjs/common';
import { TicketSeguimientoService } from './ticket-seguimiento.service';
import { TicketSeguimientoController } from './ticket-seguimiento.controller';
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  controllers: [TicketSeguimientoController],
  providers: [TicketSeguimientoService, PrismaService],
})
export class TicketSeguimientoModule {}
