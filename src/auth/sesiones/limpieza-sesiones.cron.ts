import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';

import { LimpiezaSesionesService } from './limpieza-sesiones.service';

const TAREA = 'LIMPIEZA_SESIONES';

/** 03:00 de Guatemala: sesiones muertas (30 días) e intentos de auth (90 días). */
@Injectable()
export class LimpiezaSesionesCron {
  private readonly logger = new Logger(LimpiezaSesionesCron.name);

  constructor(
    private readonly limpieza: LimpiezaSesionesService,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarSesiones(): Promise<void> {
    const fechaOperativa = this.reloj.fechaOperativa();
    try {
      await this.tareas.ejecutarTarea({
        clave: `${TAREA}:${fechaOperativa}`,
        tarea: TAREA,
        fechaOperativa,
        trabajo: async (contexto) => {
          const r = await this.limpieza.limpiar(this.reloj.ahora());
          contexto.contarProcesados(r.sesiones + r.intentos);
          contexto.anotar('sesiones', r.sesiones);
          contexto.anotar('intentos', r.intentos);
        },
      });
    } catch (error) {
      this.logger.error(
        'Falló la limpieza de sesiones.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
