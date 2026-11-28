import { Module } from '@nestjs/common';

import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';

import { TareasProgramadasFacade } from './application/facade/tareas-programadas.facade';
import { REAUTENTICACION_OPERADOR_TAREAS } from './application/ports/reautenticacion-operador.port';
import { TEMPORIZADOR } from './application/ports/temporizador.port';
import { RegistroEtapasJornadaService } from './application/services/registro-etapas-jornada.service';
import { RegistroTareasManualesService } from './application/services/registro-tareas-manuales.service';
import { EjecutarJornadaUseCase } from './application/use-cases/ejecutar-jornada.use-case';
import { EjecutarTareaManualUseCase } from './application/use-cases/ejecutar-tarea-manual.use-case';
import { EjecutarTareaProgramadaUseCase } from './application/use-cases/ejecutar-tarea-programada.use-case';
import { LimpiarEjecucionesTareaUseCase } from './application/use-cases/limpiar-ejecuciones-tarea.use-case';
import { ListarEjecucionesTareaUseCase } from './application/use-cases/listar-ejecuciones-tarea.use-case';
import { ListarTareasManualesUseCase } from './application/use-cases/listar-tareas-manuales.use-case';
import { EJECUCION_TAREA_QUERY } from './domain/ports/ejecucion-tarea-query.port';
import { EJECUCION_TAREA_REPOSITORY } from './domain/ports/ejecucion-tarea-repository.port';
import { ReautenticacionAuthAdapter } from './infra/auth/reautenticacion-auth.adapter';
import { tareasProgramadasConfigProvider } from './infra/config/tareas-programadas-config.provider';
import { EjecucionTareaPrismaQuery } from './infra/prisma/ejecucion-tarea-prisma.query';
import { EjecucionTareaPrismaRepository } from './infra/prisma/ejecucion-tarea-prisma.repository';
import { TemporizadorTimersAdapter } from './infra/timers/temporizador-timers.adapter';
import { JornadaCron } from './presentation/cron/jornada.cron';
import { LimpiezaEjecucionesCron } from './presentation/cron/limpieza-ejecuciones.cron';
import { TareasProgramadasController } from './presentation/http/tareas-programadas.controller';
import { TAREAS_PROGRAMADAS } from './public/tareas-programadas.facade.port';

/**
 * Candado por arriendo, registro de ejecuciones y reintento para todo trabajo
 * programado, más la jornada diaria y su repaso (guía de cobranza §4). No
 * conoce a ningún módulo de negocio: ellos registran sus etapas y sus tareas
 * manuales.
 *
 * API pública (`public/`): la fachada `TAREAS_PROGRAMADAS`. RELOJ, la unidad
 * de trabajo y ConfigService son globales; `AuthModule` da la reautenticación.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [TareasProgramadasController],
  providers: [
    // Casos de uso
    EjecutarTareaProgramadaUseCase,
    EjecutarJornadaUseCase,
    LimpiarEjecucionesTareaUseCase,
    ListarEjecucionesTareaUseCase,
    ListarTareasManualesUseCase,
    EjecutarTareaManualUseCase,
    // Services
    RegistroEtapasJornadaService,
    RegistroTareasManualesService,
    // Fachada
    TareasProgramadasFacade,
    { provide: TAREAS_PROGRAMADAS, useExisting: TareasProgramadasFacade },
    // Adaptadores
    {
      provide: EJECUCION_TAREA_REPOSITORY,
      useClass: EjecucionTareaPrismaRepository,
    },
    { provide: EJECUCION_TAREA_QUERY, useClass: EjecucionTareaPrismaQuery },
    {
      provide: REAUTENTICACION_OPERADOR_TAREAS,
      useClass: ReautenticacionAuthAdapter,
    },
    { provide: TEMPORIZADOR, useClass: TemporizadorTimersAdapter },
    tareasProgramadasConfigProvider,
    // Presentación
    JornadaCron,
    LimpiezaEjecucionesCron,
  ],
  exports: [TAREAS_PROGRAMADAS],
})
export class TareasProgramadasModule {}
