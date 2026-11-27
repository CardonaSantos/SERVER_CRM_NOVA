import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AvanceMetasService } from './application/services/avance-metas.service';
import { ActualizarMetaTicketUseCase } from './application/use-cases/actualizar-meta-ticket.use-case';
import { CancelarMetaTicketUseCase } from './application/use-cases/cancelar-meta-ticket.use-case';
import { CrearMetaTicketUseCase } from './application/use-cases/crear-meta-ticket.use-case';
import { ListarMetasTicketUseCase } from './application/use-cases/listar-metas-ticket.use-case';
import { ObtenerMetaTicketUseCase } from './application/use-cases/obtener-meta-ticket.use-case';
import { ObtenerResueltosPorDiaUseCase } from './application/use-cases/obtener-resueltos-por-dia.use-case';
import { ObtenerResumenMetricasUseCase } from './application/use-cases/obtener-resumen-metricas.use-case';
import { META_TICKET_QUERY } from './domain/ports/meta-ticket-query.port';
import { META_TICKET_REPOSITORY } from './domain/ports/meta-ticket-repository.port';
import { METRICA_TICKET_QUERY } from './domain/ports/metrica-ticket-query.port';
import { MetaTicketPrismaQuery } from './infra/prisma/meta-ticket-prisma.query';
import { MetaTicketPrismaRepository } from './infra/prisma/meta-ticket-prisma.repository';
import { MetricaTicketPrismaQuery } from './infra/prisma/metrica-ticket-prisma.query';
import { TicketMetaController } from './presentation/http/ticket-meta.controller';
import { TicketMetricaController } from './presentation/http/ticket-metrica.controller';

/**
 * Metas de tickets por técnico y métricas de rendimiento. Solo escribe las
 * metas; el avance se calcula leyendo los tickets.
 */
@Module({
  imports: [PrismaModule],
  controllers: [TicketMetaController, TicketMetricaController],
  providers: [
    // Casos de uso
    CrearMetaTicketUseCase,
    ActualizarMetaTicketUseCase,
    CancelarMetaTicketUseCase,
    ListarMetasTicketUseCase,
    ObtenerMetaTicketUseCase,
    ObtenerResumenMetricasUseCase,
    ObtenerResueltosPorDiaUseCase,
    // Services
    AvanceMetasService,
    // Adaptadores
    { provide: META_TICKET_REPOSITORY, useClass: MetaTicketPrismaRepository },
    { provide: META_TICKET_QUERY, useClass: MetaTicketPrismaQuery },
    { provide: METRICA_TICKET_QUERY, useClass: MetricaTicketPrismaQuery },
  ],
})
export class TicketSoporteMetricaModule {}
