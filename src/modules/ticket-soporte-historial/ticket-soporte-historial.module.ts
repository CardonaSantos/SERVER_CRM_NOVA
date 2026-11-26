import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TicketSoporteHistorialFacade } from './application/facade/ticket-soporte-historial.facade';
import { ListarTicketSoporteHistorialUseCase } from './application/use-cases/listar-ticket-soporte-historial.use-case';
import { ObtenerTicketSoporteHistorialUseCase } from './application/use-cases/obtener-ticket-soporte-historial.use-case';
import { RegistrarActualizacionTicketUseCase } from './application/use-cases/registrar-actualizacion-ticket.use-case';
import { RegistrarEventoTicketHistorialUseCase } from './application/use-cases/registrar-evento-ticket-historial.use-case';
import { TICKET_SOPORTE_HISTORIAL_QUERY } from './domain/ports/ticket-soporte-historial-query.port';
import { TICKET_SOPORTE_HISTORIAL_REPOSITORY } from './domain/ports/ticket-soporte-historial-repository.port';
import { TicketSoporteHistorialPrismaQuery } from './infra/prisma/ticket-soporte-historial-prisma.query';
import { TicketSoporteHistorialPrismaRepository } from './infra/prisma/ticket-soporte-historial-prisma.repository';
import { TicketSoporteHistorialController } from './presentation/http/ticket-soporte-historial.controller';
import { TICKET_SOPORTE_HISTORIAL } from './public/ticket-soporte-historial.facade.port';

/**
 * Bitácora de tickets de soporte (append-only).
 *
 * API pública (`public/`): TICKET_SOPORTE_HISTORIAL (registrar eventos) y los
 * tipos de `ticket-soporte-historial.types.ts`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TicketSoporteHistorialController],
  providers: [
    // Casos de uso
    RegistrarEventoTicketHistorialUseCase,
    RegistrarActualizacionTicketUseCase,
    ListarTicketSoporteHistorialUseCase,
    ObtenerTicketSoporteHistorialUseCase,

    // Fachada
    TicketSoporteHistorialFacade,
    {
      provide: TICKET_SOPORTE_HISTORIAL,
      useExisting: TicketSoporteHistorialFacade,
    },

    // Adaptadores
    {
      provide: TICKET_SOPORTE_HISTORIAL_REPOSITORY,
      useClass: TicketSoporteHistorialPrismaRepository,
    },
    {
      provide: TICKET_SOPORTE_HISTORIAL_QUERY,
      useClass: TicketSoporteHistorialPrismaQuery,
    },
  ],
  exports: [TICKET_SOPORTE_HISTORIAL],
})
export class TicketSoporteHistorialModule {}
