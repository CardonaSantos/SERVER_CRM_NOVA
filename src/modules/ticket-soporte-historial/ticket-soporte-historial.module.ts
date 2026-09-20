import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TicketSoporteHistorialService } from './application/services/ticket-soporte-historial.service';
import { ListarTicketSoporteHistorialUseCase } from './application/use-cases/listar-ticket-soporte-historial.use-case';
import { ObtenerTicketSoporteHistorialUseCase } from './application/use-cases/obtener-ticket-soporte-historial.use-case';
import { RegistrarActualizacionTicketUseCase } from './application/use-cases/registrar-actualizacion-ticket.use-case';
import { RegistrarTicketSoporteHistorialUseCase } from './application/use-cases/registrar-ticket-soporte-historial.use-case';
import { TICKET_SOPORTE_HISTORIAL_REPOSITORY } from './domain/ports/ticket-soporte-historial-repository.port';
import { TicketSoporteHistorialPrismaRepository } from './infra/prisma/ticket-soporte-historial-prisma.repository';
import { TicketSoporteHistorialPrismaTxBridge } from './infra/prisma/ticket-soporte-historial-prisma-tx.bridge';
import { TicketSoporteHistorialController } from './presentation/ticket-soporte-historial.controller';

@Module({
  imports: [PrismaModule],
  controllers: [TicketSoporteHistorialController],
  providers: [
    TicketSoporteHistorialService,
    RegistrarTicketSoporteHistorialUseCase,
    RegistrarActualizacionTicketUseCase,
    ListarTicketSoporteHistorialUseCase,
    ObtenerTicketSoporteHistorialUseCase,
    TicketSoporteHistorialPrismaTxBridge,
    {
      provide: TICKET_SOPORTE_HISTORIAL_REPOSITORY,
      useClass: TicketSoporteHistorialPrismaRepository,
    },
  ],
  exports: [
    TicketSoporteHistorialService,
    TicketSoporteHistorialPrismaTxBridge,
    TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  ],
})
export class TicketSoporteHistorialModule {}
