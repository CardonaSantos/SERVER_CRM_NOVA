import { Module } from '@nestjs/common';

import { TareasProgramadasFacade } from './application/facade/tareas-programadas.facade';
import { TEMPORIZADOR } from './application/ports/temporizador.port';
import { EjecutarTareaProgramadaUseCase } from './application/use-cases/ejecutar-tarea-programada.use-case';
import { EJECUCION_TAREA_REPOSITORY } from './domain/ports/ejecucion-tarea-repository.port';
import { tareasProgramadasConfigProvider } from './infra/config/tareas-programadas-config.provider';
import { EjecucionTareaPrismaRepository } from './infra/prisma/ejecucion-tarea-prisma.repository';
import { TemporizadorTimersAdapter } from './infra/timers/temporizador-timers.adapter';
import { TAREAS_PROGRAMADAS } from './public/tareas-programadas.facade.port';

/**
 * Candado por arriendo, registro de ejecuciones y reintento para todo trabajo
 * programado (guía de cobranza §4). No conoce a ningún módulo de negocio.
 *
 * API pública (`public/`): la fachada `TAREAS_PROGRAMADAS`. RELOJ, la unidad
 * de trabajo y ConfigService son globales.
 */
@Module({
  providers: [
    // Casos de uso
    EjecutarTareaProgramadaUseCase,
    // Fachada
    TareasProgramadasFacade,
    { provide: TAREAS_PROGRAMADAS, useExisting: TareasProgramadasFacade },
    // Adaptadores
    {
      provide: EJECUCION_TAREA_REPOSITORY,
      useClass: EjecucionTareaPrismaRepository,
    },
    { provide: TEMPORIZADOR, useClass: TemporizadorTimersAdapter },
    tareasProgramadasConfigProvider,
  ],
  exports: [TAREAS_PROGRAMADAS],
})
export class TareasProgramadasModule {}
