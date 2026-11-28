import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { EjecutarTareaProgramadaUseCase } from '../../application/use-cases/ejecutar-tarea-programada.use-case';
import { LimpiarEjecucionesTareaUseCase } from '../../application/use-cases/limpiar-ejecuciones-tarea.use-case';

const TAREA = 'LIMPIEZA_EJECUCIONES';

/** 03:00 de Guatemala: borra del registro lo de hace más de 180 días. */
@Injectable()
export class LimpiezaEjecucionesCron {
  private readonly logger = new Logger(LimpiezaEjecucionesCron.name);

  constructor(
    private readonly ejecutarTarea: EjecutarTareaProgramadaUseCase,
    private readonly limpiar: LimpiarEjecucionesTareaUseCase,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarEjecuciones(): Promise<void> {
    const fechaOperativa = this.reloj.fechaOperativa();
    try {
      await this.ejecutarTarea.execute({
        clave: `${TAREA}:${fechaOperativa}`,
        tarea: TAREA,
        fechaOperativa,
        trabajo: async (contexto) => {
          const r = await this.limpiar.execute();
          contexto.contarProcesados(r.borradas);
          contexto.anotar('anterioresA', r.anterioresA);
        },
      });
    } catch (error) {
      this.logger.error(
        'Falló la limpieza del registro de tareas.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
