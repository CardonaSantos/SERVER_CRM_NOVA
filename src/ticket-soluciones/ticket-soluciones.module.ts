// ticket-soluciones.module.ts
import { Module } from '@nestjs/common';
import { TicketSolucionesService } from './app/ticket-soluciones.service';
import { TicketSolucionRepository } from './domain/ticket-solucion.repository';
import { PrismaService } from 'src/prisma/prisma.service';
import { TicketSolucionesController } from './presentation/tickets-soluciones.controller';
import { TicketSolucionRepositoryPrisma } from './infrastructure/ticket-soporte-prisma.repository';

@Module({
  controllers: [TicketSolucionesController],
  providers: [
    TicketSolucionesService,
    PrismaService,
    {
      provide: TicketSolucionRepository,
      useClass: TicketSolucionRepositoryPrisma,
    },
  ],
  exports: [TicketSolucionesService],
})
export class TicketSolucionesModule {}
