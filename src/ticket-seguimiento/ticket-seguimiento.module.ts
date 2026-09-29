import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PrismaService } from 'src/prisma/prisma.service';

import { TicketSeguimientoController } from './ticket-seguimiento.controller';
import { TicketSeguimientoService } from './ticket-seguimiento.service';

@Module({
  imports: [AuthModule],
  controllers: [TicketSeguimientoController],
  providers: [TicketSeguimientoService, PrismaService],
})
export class TicketSeguimientoModule {}
