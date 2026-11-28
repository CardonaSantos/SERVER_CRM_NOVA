import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import {
  ResultadoTareaProgramada,
  TAREAS_PROGRAMADAS,
  TareasProgramadasPort,
} from 'src/modules/tareas-programadas/public/tareas-programadas.facade.port';
import { OrigenEjecucionTarea } from 'src/modules/tareas-programadas/public/tareas-programadas.types';
import { ExpirarTecnicoTrackingUseCase } from '../../application/use-cases/expirar-tecnico-tracking.use-case';
import { claveExpiracionTracking } from '../../domain/policies/fecha-laboral-tracking.policy';

/** Una sesión se considera abandonada tras 2 horas sin heartbeat. */
const SESION_ABANDONADA_MS = 2 * 60 * 60 * 1000;

const LOTE_MAXIMO = 500;

const TAREA = 'TRACKING_EXPIRACION';

@Injectable()
export class TecnicoTrackingExpiracionCron implements OnModuleInit {
  private readonly logger = new Logger(TecnicoTrackingExpiracionCron.name);

  constructor(
    private readonly expirarTracking: ExpirarTecnicoTrackingUseCase,
    @Inject(TAREAS_PROGRAMADAS)
    private readonly tareas: TareasProgramadasPort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  onModuleInit(): void {
    this.tareas.registrarTareaManual({
      tarea: TAREA,
      descripcion:
        'Cierra los recorridos de técnicos que llevan más de 2 horas sin reportar ubicación.',
      ejecutar: (quien) => this.correr(quien),
    });
  }

  /**
   * A los :45 de cada 2 horas (01:45, 03:45… 23:45), hora de Guatemala, para
   * no coincidir con la jornada ni con las tareas en punto. El candado de
   * `tareas-programadas` evita que dos vueltas o dos instancias se solapen.
   */
  @Cron('45 1-23/2 * * *', { timeZone: 'America/Guatemala' })
  async expirarSesionesAbandonadas(): Promise<void> {
    try {
      await this.correr();
    } catch (error) {
      this.logger.error(
        'Falló la revisión automática de sesiones de tracking.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  private correr(quien?: {
    ejecutadaPorId: number;
  }): Promise<ResultadoTareaProgramada> {
    const ahora = this.reloj.ahora();

    return this.tareas.ejecutarTarea({
      clave: claveExpiracionTracking(ahora),
      tarea: TAREA,
      fechaOperativa: this.reloj.fechaOperativa(),
      ...(quien && {
        origen: OrigenEjecucionTarea.MANUAL,
        ejecutadaPorId: quien.ejecutadaPorId,
      }),
      trabajo: async (contexto) => {
        const heartbeatBefore = new Date(
          ahora.getTime() - SESION_ABANDONADA_MS,
        );

        const resultado = await this.expirarTracking.execute({
          heartbeatBefore,
          limit: LOTE_MAXIMO,
        });

        contexto.contarProcesados(resultado.expiradas);
        contexto.anotar('encontradas', resultado.encontradas);
        contexto.anotar(
          'omitidasPorConcurrencia',
          resultado.omitidasPorConcurrencia,
        );

        this.logger.log(
          `Revisión de tracking completada. encontradas=${resultado.encontradas} expiradas=${resultado.expiradas} omitidasPorConcurrencia=${resultado.omitidasPorConcurrencia}`,
        );
      },
    });
  }
}
