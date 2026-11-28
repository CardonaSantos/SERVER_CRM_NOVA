import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ResultadoTareaProgramada,
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { OrigenEjecucionTarea } from 'src/modules/tareas-programadas/public/tareas-programadas.types';

import { LimpiezaSesionesService } from './limpieza-sesiones.service';

const TAREA = 'LIMPIEZA_SESIONES';

/** 03:00 de Guatemala: sesiones muertas (30 días) e intentos de auth (90 días). */
@Injectable()
export class LimpiezaSesionesCron implements OnModuleInit {
  private readonly logger = new Logger(LimpiezaSesionesCron.name);

  constructor(
    private readonly limpieza: LimpiezaSesionesService,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.tareas.registrarTareaManual({
      tarea: TAREA,
      descripcion:
        'Borra las sesiones revocadas o vencidas hace más de 30 días y los intentos de acceso de más de 90.',
      ejecutar: (quien) => this.correr(quien),
    });
  }

  @Cron('0 3 * * *', { timeZone: 'America/Guatemala' })
  async limpiarSesiones(): Promise<void> {
    try {
      await this.correr();
    } catch (error) {
      this.logger.error(
        'Falló la limpieza de sesiones.',
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
        const r = await this.limpieza.limpiar(this.reloj.ahora());
        contexto.contarProcesados(r.sesiones + r.intentos);
        contexto.anotar('sesiones', r.sesiones);
        contexto.anotar('intentos', r.intentos);
      },
    });
  }
}
