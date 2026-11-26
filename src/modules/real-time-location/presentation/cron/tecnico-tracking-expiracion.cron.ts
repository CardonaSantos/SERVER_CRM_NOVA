import { Inject, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { ExpirarTecnicoTrackingUseCase } from '../../application/use-cases/expirar-tecnico-tracking.use-case';

/** Una sesión se considera abandonada tras 2 horas sin heartbeat. */
const SESION_ABANDONADA_MS = 2 * 60 * 60 * 1000;

const LOTE_MAXIMO = 500;

@Injectable()
export class TecnicoTrackingExpiracionCron {
  private readonly logger = new Logger(TecnicoTrackingExpiracionCron.name);

  /** Evita que dos ejecuciones del mismo proceso se solapen. */
  private enCurso = false;

  constructor(
    private readonly expirarTracking: ExpirarTecnicoTrackingUseCase,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  /** Cada 2 horas en punto (00:00, 02:00… 22:00), hora de Guatemala. */
  @Cron('0 */2 * * *', { timeZone: 'America/Guatemala' })
  async expirarSesionesAbandonadas(): Promise<void> {
    if (this.enCurso) {
      this.logger.warn(
        'Se omitió la expiración de tracking porque existe una ejecución anterior en curso.',
      );

      return;
    }

    this.enCurso = true;

    try {
      const heartbeatBefore = new Date(
        this.reloj.ahora().getTime() - SESION_ABANDONADA_MS,
      );

      this.logger.log(
        `Iniciando revisión de sesiones de tracking expiradas. heartbeatBefore=${heartbeatBefore.toISOString()}`,
      );

      const resultado = await this.expirarTracking.execute({
        heartbeatBefore,
        limit: LOTE_MAXIMO,
      });

      if (resultado.encontradas === 0) {
        this.logger.log(
          'No se encontraron sesiones de tracking pendientes de expiración.',
        );

        return;
      }

      this.logger.log(
        `Revisión de tracking completada. encontradas=${resultado.encontradas} expiradas=${resultado.expiradas} omitidasPorConcurrencia=${resultado.omitidasPorConcurrencia}`,
      );
    } catch (error) {
      this.logger.error(
        'Falló la revisión automática de sesiones de tracking.',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.enCurso = false;
    }
  }
}
