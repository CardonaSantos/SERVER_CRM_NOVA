import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ResultadoTareaProgramada,
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { OrigenEjecucionTarea } from 'src/modules/tareas-programadas/public/tareas-programadas.types';

import { LimpiarNotificacionesUseCase } from '../../application/use-cases/limpiar-notificaciones.use-case';

const TAREA = 'LIMPIEZA_NOTIFICACIONES';

/** 03:00 de Guatemala: borra las notificaciones de hace más de 90 días. */
@Injectable()
export class LimpiezaNotificacionesCron implements OnModuleInit {
  private readonly logger = new Logger(LimpiezaNotificacionesCron.name);

  constructor(
    private readonly limpiar: LimpiarNotificacionesUseCase,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.tareas.registrarTareaManual({
      tarea: TAREA,
      descripcion:
        'Borra las notificaciones de hace más de 90 días, también de las bandejas.',
      ejecutar: (quien) => this.correr(quien),
    });
  }

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarNotificaciones(): Promise<void> {
    try {
      await this.correr();
    } catch (error) {
      this.logger.error(
        'Falló la limpieza de notificaciones.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private correr(quien?: {
    ejecutadaPorId: number;
  }): Promise<ResultadoTareaProgramada> {
    const fechaOperativa = this.reloj.fechaOperativa();
    return this.tareas.ejecutarTarea({
      clave: `${TAREA}:${fechaOperativa}`,
      tarea: TAREA,
      fechaOperativa,
      ...(quien && {
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: quien.ejecutadaPorId,
      }),
      trabajo: async (contexto) => {
        const { borradas } = await this.limpiar.execute();
        contexto.contarProcesados(borradas);
      },
    });
  }
}
