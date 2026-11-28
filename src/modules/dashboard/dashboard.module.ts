import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TareasProgramadasModule } from 'src/modules/tareas-programadas/tareas-programadas.module';
import { TomarFotoMensualUseCase } from './application/use-cases/tomar-foto-mensual.use-case';
import { FOTO_MENSUAL_CARTERA_REPOSITORY } from './domain/ports/foto-mensual-cartera-repository.port';
import { FotoMensualCarteraPrismaRepository } from './infra/prisma/foto-mensual-cartera-prisma.repository';
import { FotoMensualCron } from './presentation/cron/foto-mensual.cron';
import { ObtenerActividadTicketsUseCase } from './application/use-cases/obtener-actividad-tickets.use-case';
import { ObtenerClientesPorPlanUseCase } from './application/use-cases/obtener-clientes-por-plan.use-case';
import { ObtenerClientesPorUbicacionUseCase } from './application/use-cases/obtener-clientes-por-ubicacion.use-case';
import { ObtenerCobradoPorMetodoUseCase } from './application/use-cases/obtener-cobrado-por-metodo.use-case';
import { ObtenerCobrosUseCase } from './application/use-cases/obtener-cobros.use-case';
import { ObtenerDeudaAntiguedadUseCase } from './application/use-cases/obtener-deuda-antiguedad.use-case';
import { ObtenerFacturacionMensualUseCase } from './application/use-cases/obtener-facturacion-mensual.use-case';
import { ObtenerInstalacionesHistoricasUseCase } from './application/use-cases/obtener-instalaciones-historicas.use-case';
import { ObtenerInstalacionesMesUseCase } from './application/use-cases/obtener-instalaciones-mes.use-case';
import { ObtenerPanelTecnicoUseCase } from './application/use-cases/obtener-panel-tecnico.use-case';
import { ObtenerResumenUseCase } from './application/use-cases/obtener-resumen.use-case';
import { ACTIVIDAD_TICKETS_QUERY } from './domain/ports/actividad-tickets-query.port';
import { CARTERA_QUERY } from './domain/ports/cartera-query.port';
import { COBROS_QUERY } from './domain/ports/cobros-query.port';
import { FINANZAS_QUERY } from './domain/ports/finanzas-query.port';
import { INSTALACIONES_QUERY } from './domain/ports/instalaciones-query.port';
import { PANEL_TECNICO_QUERY } from './domain/ports/panel-tecnico-query.port';
import { RESUMEN_QUERY } from './domain/ports/resumen-query.port';
import { ActividadTicketsPrismaQuery } from './infra/prisma/actividad-tickets-prisma.query';
import { CarteraPrismaQuery } from './infra/prisma/cartera-prisma.query';
import { CobrosPrismaQuery } from './infra/prisma/cobros-prisma.query';
import { FinanzasPrismaQuery } from './infra/prisma/finanzas-prisma.query';
import { InstalacionesPrismaQuery } from './infra/prisma/instalaciones-prisma.query';
import { PanelTecnicoPrismaQuery } from './infra/prisma/panel-tecnico-prisma.query';
import { ResumenPrismaQuery } from './infra/prisma/resumen-prisma.query';
import { DashboardController } from './presentation/http/dashboard.controller';
import { GraficasController } from './presentation/http/graficas.controller';

/**
 * Paneles de solo lectura, sin fachada. Lo único que escribe es su propia foto
 * mensual de la cartera (para las gráficas de evolución).
 */
@Module({
  imports: [PrismaModule, TareasProgramadasModule],
  controllers: [DashboardController, GraficasController],
  providers: [
    // Casos de uso
    ObtenerResumenUseCase,
    ObtenerInstalacionesMesUseCase,
    ObtenerInstalacionesHistoricasUseCase,
    ObtenerActividadTicketsUseCase,
    ObtenerCobrosUseCase,
    ObtenerPanelTecnicoUseCase,
    ObtenerFacturacionMensualUseCase,
    ObtenerCobradoPorMetodoUseCase,
    ObtenerDeudaAntiguedadUseCase,
    ObtenerClientesPorPlanUseCase,
    ObtenerClientesPorUbicacionUseCase,
    TomarFotoMensualUseCase,
    // Cron
    FotoMensualCron,
    // Adaptadores
    { provide: RESUMEN_QUERY, useClass: ResumenPrismaQuery },
    { provide: FINANZAS_QUERY, useClass: FinanzasPrismaQuery },
    { provide: CARTERA_QUERY, useClass: CarteraPrismaQuery },
    { provide: INSTALACIONES_QUERY, useClass: InstalacionesPrismaQuery },
    { provide: ACTIVIDAD_TICKETS_QUERY, useClass: ActividadTicketsPrismaQuery },
    { provide: COBROS_QUERY, useClass: CobrosPrismaQuery },
    { provide: PANEL_TECNICO_QUERY, useClass: PanelTecnicoPrismaQuery },
    {
      provide: FOTO_MENSUAL_CARTERA_REPOSITORY,
      useClass: FotoMensualCarteraPrismaRepository,
    },
  ],
})
export class DashboardModule {}
