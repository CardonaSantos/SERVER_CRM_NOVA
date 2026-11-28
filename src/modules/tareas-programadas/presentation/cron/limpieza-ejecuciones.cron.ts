import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { RegistroTareasManualesService } from '../../application/services/registro-tareas-manuales.service';
import { EjecutarTareaProgramadaUseCase } from '../../application/use-cases/ejecutar-tarea-programada.use-case';
import { LimpiarEjecucionesTareaUseCase } from '../../application/use-cases/limpiar-ejecuciones-tarea.use-case';
import { OrigenEjecucionTarea } from '../../domain/enums/ejecucion-tarea.enum';
import { ResultadoTareaProgramada } from '../../public/tareas-programadas.facade.port';

const TAREA = 'LIMPIEZA_EJECUCIONES';

/** 03:00 de Guatemala: borra del registro lo de hace más de 180 días. */
@Injectable()
export class LimpiezaEjecucionesCron implements OnModuleInit {
  private readonly logger = new Logger(LimpiezaEjecucionesCron.name);

  constructor(
    private readonly ejecutarTarea: EjecutarTareaProgramadaUseCase,
    private readonly limpiar: LimpiarEjecucionesTareaUseCase,
    private readonly manuales: RegistroTareasManualesService,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.manuales.registrar({
      tarea: TAREA,
      descripcion:
        'Borra del registro de tareas las ejecuciones de hace más de 180 días.',
      ejecutar: (quien) => this.correr(quien),
    });
  }

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarEjecuciones(): Promise<void> {
    try {
      await this.correr();
    } catch (error) {
      this.logger.error(
        'Falló la limpieza del registro de tareas.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private correr(quien?: {
    ejecutadaPorId: number;
  }): Promise<ResultadoTareaProgramada> {
    const fechaOperativa = this.reloj.fechaOperativa();
    return this.ejecutarTarea.execute({
      clave: `${TAREA}:${fechaOperativa}`,
      tarea: TAREA,
      fechaOperativa,
      ...(quien && {
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: quien.ejecutadaPorId,
      }),
      trabajo: async (contexto) => {
        const r = await this.limpiar.execute();
        contexto.contarProcesados(r.borradas);
        contexto.anotar('anterioresA', r.anterioresA);
      },
    });
  }
}
