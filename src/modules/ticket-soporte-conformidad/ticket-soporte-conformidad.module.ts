import { Module } from '@nestjs/common';
import { TicketSoporteConformidadService } from './application/services/ticket-soporte-conformidad.service';
import { TicketSoporteConformidadController } from './presentation/ticket-soporte-conformidad.controller';

@Module({
  controllers: [TicketSoporteConformidadController],
  providers: [TicketSoporteConformidadService],
})
export class TicketSoporteConformidadModule {}
