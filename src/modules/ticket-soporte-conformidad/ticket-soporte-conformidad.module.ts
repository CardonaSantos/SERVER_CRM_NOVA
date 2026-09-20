import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { GenerarEnlaceTicketConformidadUseCase } from './application/use-cases/generar-enlace-ticket-conformidad.use-case';
import { ObtenerTicketConformidadPublicaUseCase } from './application/use-cases/obtener-ticket-conformidad-publica.use-case';
import { RequerirRetrabajoTicketConformidadUseCase } from './application/use-cases/requerir-retrabajo-ticket-conformidad.use-case';
import { RegistrarFirmaClienteTicketConformidadUseCase } from './application/use-cases/registrar-firma-cliente-ticket-conformidad.use-case';
import { TICKET_CONFORMIDAD_REPOSITORY } from './domain/ports/ticket-conformidad.repository.port';
import { TICKET_FIRMA_REPOSITORY } from './domain/ports/ticket-firma.repository.port';
import { TICKET_CONFORMIDAD_ENLACE_REPOSITORY } from './domain/ports/ticket-conformidad-enlace.repository.port';
import { DigitalOceanMediaModule } from '../digital-ocean-media/digital-ocean-media.module';
import { TicketConformidadController } from './presentation/ticket-soporte-conformidad.controller';
import { TicketConformidadPublicController } from './presentation/ticket-conformidad-public.controller';
import { TicketConformidadPrismaRepository } from './infra/prisma/repositories/ticket-conformidad-prisma.repository';
import { TicketFirmaPrismaRepository } from './infra/prisma/repositories/ticket-firma-prisma.repository';
import { TicketConformidadEnlacePrismaRepository } from './infra/prisma/repositories/ticket-conformidad-enlace-prisma.repository';
import { TICKET_CONFORMIDAD_QUERY_PORT } from './application/port/ticket-conformidad-query.port';
import { TicketConformidadPrismaQuery } from './infra/prisma/query/ticket-conformidad-prisma.query';
import { TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT } from './application/port/ticket-conformidad-public-query.port';
import { TicketConformidadPublicPrismaQuery } from './infra/prisma/query/ticket-conformidad-public-prisma.query';
import { TICKET_CONFORMIDAD_TICKET_PORT } from './application/port/ticket-conformidad-ticket.port';
import { TicketConformidadTicketPrismaAdapter } from './infra/prisma/adapters/ticket-conformidad-ticket-prisma.adapter';
import { TICKET_CONFORMIDAD_TOKEN_PORT } from './application/port/ticket-conformidad-token.port';
import { TicketConformidadCryptoTokenAdapter } from './infra/security/ticket-conformidad-crypto-token.adapter';
import { TICKET_CONFORMIDAD_LINK_CONFIG_PORT } from './application/port/ticket-conformidad-link-config.port';
import { TicketConformidadLinkConfigAdapter } from './infra/config/ticket-conformidad-link-config.adapter';
import { TICKET_CONFORMIDAD_TRANSACTION_PORT } from './application/port/ticket-conformidad-transaction.port';
import { TicketConformidadPrismaTransaction } from './infra/prisma/transactions/ticket-conformidad-prisma.transaction';
import { TICKET_FIRMA_MEDIA_PORT } from './application/port/ticket-firma-media.port';
import { TicketFirmaMediaAdapter } from './infra/media/ticket-firma-media.adapter';
import { CrearTicketConformidadUseCase } from './application/use-cases/crear-conformidad.use-case';
import { TicketConformidadApplicationService } from './application/services/ticket-soporte-conformidad.service';
import { RegistrarFirmaTecnicoTicketConformidadUseCase } from './application/use-cases/registrar-firma-tecnico.use-case';

@Module({
  imports: [ConfigModule, DigitalOceanMediaModule],
  controllers: [TicketConformidadController, TicketConformidadPublicController],

  providers: [
    PrismaService,

    {
      provide: TICKET_CONFORMIDAD_REPOSITORY,
      useClass: TicketConformidadPrismaRepository,
    },

    {
      provide: TICKET_FIRMA_REPOSITORY,
      useClass: TicketFirmaPrismaRepository,
    },

    {
      provide: TICKET_CONFORMIDAD_ENLACE_REPOSITORY,
      useClass: TicketConformidadEnlacePrismaRepository,
    },

    /* =====================================================
     * QUERIES
     * =================================================== */

    {
      provide: TICKET_CONFORMIDAD_QUERY_PORT,
      useClass: TicketConformidadPrismaQuery,
    },

    {
      provide: TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT,
      useClass: TicketConformidadPublicPrismaQuery,
    },

    /* =====================================================
     * TICKET CONTEXT
     * =================================================== */

    {
      provide: TICKET_CONFORMIDAD_TICKET_PORT,
      useClass: TicketConformidadTicketPrismaAdapter,
    },

    /* =====================================================
     * TOKEN
     * =================================================== */

    {
      provide: TICKET_CONFORMIDAD_TOKEN_PORT,
      useClass: TicketConformidadCryptoTokenAdapter,
    },

    /* =====================================================
     * LINK CONFIG
     * =================================================== */

    {
      provide: TICKET_CONFORMIDAD_LINK_CONFIG_PORT,
      useClass: TicketConformidadLinkConfigAdapter,
    },

    /* =====================================================
     * TRANSACTIONS
     * =================================================== */

    {
      provide: TICKET_CONFORMIDAD_TRANSACTION_PORT,
      useClass: TicketConformidadPrismaTransaction,
    },

    /* =====================================================
     * MEDIA BRIDGE
     * =================================================== */

    {
      provide: TICKET_FIRMA_MEDIA_PORT,
      useClass: TicketFirmaMediaAdapter,
    },

    /* =====================================================
     * USE CASES
     * =================================================== */

    CrearTicketConformidadUseCase,

    GenerarEnlaceTicketConformidadUseCase,

    ObtenerTicketConformidadPublicaUseCase,

    RequerirRetrabajoTicketConformidadUseCase,

    RegistrarFirmaClienteTicketConformidadUseCase,

    TicketConformidadApplicationService,

    RegistrarFirmaTecnicoTicketConformidadUseCase,
  ],

  exports: [TicketConformidadApplicationService, TICKET_CONFORMIDAD_QUERY_PORT],
})
export class TicketSoporteConformidadModule {}
