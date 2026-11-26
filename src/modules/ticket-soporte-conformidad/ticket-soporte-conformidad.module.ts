import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { TICKET_FIRMA_MEDIA } from './application/ports/ticket-firma-media.port';
import { CrearTicketConformidadUseCase } from './application/use-cases/crear-ticket-conformidad.use-case';
import { ObtenerConformidadActualTicketUseCase } from './application/use-cases/obtener-conformidad-actual-ticket.use-case';
import { ObtenerDetalleTicketConformidadUseCase } from './application/use-cases/obtener-detalle-ticket-conformidad.use-case';
import { ObtenerHistorialConformidadTicketUseCase } from './application/use-cases/obtener-historial-conformidad-ticket.use-case';
import { RegistrarFirmaTecnicoTicketConformidadUseCase } from './application/use-cases/registrar-firma-tecnico-ticket-conformidad.use-case';
import { TICKET_CONFORMIDAD_QUERY } from './domain/ports/ticket-conformidad-query.port';
import { TICKET_CONFORMIDAD_REPOSITORY } from './domain/ports/ticket-conformidad-repository.port';
import { TICKET_FIRMA_REPOSITORY } from './domain/ports/ticket-firma-repository.port';
import { TICKET_SOPORTE_CONTEXTO_QUERY } from './domain/ports/ticket-soporte-contexto-query.port';
import { TicketFirmaMediaAlmacenamientoAdapter } from './infra/almacenamiento/ticket-firma-media-almacenamiento.adapter';
import { TicketConformidadPrismaQuery } from './infra/prisma/ticket-conformidad-prisma.query';
import { TicketConformidadPrismaRepository } from './infra/prisma/ticket-conformidad-prisma.repository';
import { TicketFirmaPrismaRepository } from './infra/prisma/ticket-firma-prisma.repository';
import { TicketSoporteContextoPrismaQuery } from './infra/prisma/ticket-soporte-contexto-prisma.query';
import { TicketSoporteConformidadController } from './presentation/http/ticket-soporte-conformidad.controller';

/**
 * Conformidad de tickets de soporte: ciclo de conformidad y firma del técnico.
 *
 * API pública (`public/`): los enums de `ticket-soporte-conformidad.types.ts`.
 */
@Module({
  imports: [PrismaModule, AlmacenamientoMediaModule],
  controllers: [TicketSoporteConformidadController],
  providers: [
    // Casos de uso
    CrearTicketConformidadUseCase,
    RegistrarFirmaTecnicoTicketConformidadUseCase,
    ObtenerDetalleTicketConformidadUseCase,
    ObtenerConformidadActualTicketUseCase,
    ObtenerHistorialConformidadTicketUseCase,

    // Adaptadores
    {
      provide: TICKET_CONFORMIDAD_REPOSITORY,
      useClass: TicketConformidadPrismaRepository,
    },
    {
      provide: TICKET_FIRMA_REPOSITORY,
      useClass: TicketFirmaPrismaRepository,
    },
    {
      provide: TICKET_CONFORMIDAD_QUERY,
      useClass: TicketConformidadPrismaQuery,
    },
    {
      provide: TICKET_SOPORTE_CONTEXTO_QUERY,
      useClass: TicketSoporteContextoPrismaQuery,
    },
    {
      provide: TICKET_FIRMA_MEDIA,
      useClass: TicketFirmaMediaAlmacenamientoAdapter,
    },
  ],
})
export class TicketSoporteConformidadModule {}
