import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';

import { LimpiarNotificacionesUseCase } from '../../application/use-cases/limpiar-notificaciones.use-case';

const TAREA = 'LIMPIEZA_NOTIFICACIONES';

/** 03:00 de Guatemala: borra las notificaciones de hace más de 90 días. */
@Injectable()
export class LimpiezaNotificacionesCron {
  private readonly logger = new Logger(LimpiezaNotificacionesCron.name);

  constructor(
    private readonly limpiar: LimpiarNotificacionesUseCase,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarNotificaciones(): Promise<void> {
    const fechaOperativa = this.reloj.fechaOperativa();
    try {
      await this.tareas.ejecutarTarea({
        clave: `${TAREA}:${fechaOperativa}`,
        tarea: TAREA,
        fechaOperativa,
        trabajo: async (contexto) => {
          const { borradas } = await this.limpiar.execute();
          contexto.contarProcesados(borradas);
        },
      });
    } catch (error) {
      this.logger.error(
        'Falló la limpieza de notificaciones.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
