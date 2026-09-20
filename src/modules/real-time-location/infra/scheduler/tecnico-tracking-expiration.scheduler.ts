import { Injectable, Logger } from '@nestjs/common';

import { Cron } from '@nestjs/schedule';

import { ExpirarTecnicoTrackingUseCase } from '../../application/use-cases/expirar-tecnico-tracking.use-case';

@Injectable()
export class TecnicoTrackingExpirationScheduler {
  private readonly logger = new Logger(TecnicoTrackingExpirationScheduler.name);

  /**
   * Una sesión se considera abandonada
   * después de 2 horas sin heartbeat.
   */
  private static readonly STALE_AFTER_MS = 2 * 60 * 60 * 1000;

  /**
   * Defensa adicional para evitar que dos
   * ejecuciones del mismo proceso se solapen.
   */
  private isRunning = false;

  constructor(
    private readonly expirarTracking: ExpirarTecnicoTrackingUseCase,
  ) {}

  /**
   * Cada 2 horas:
   *
   * 00:00
   * 02:00
   * 04:00
   * ...
   * 22:00
   *
   * Zona horaria Guatemala.
   */
  @Cron('0 */2 * * *', {
    timeZone: 'America/Guatemala',
  })
  async expireStaleTrackingSessions(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn(
        'Se omitió la expiración de tracking porque existe una ejecución anterior en curso.',
      );

      return;
    }

    this.isRunning = true;

    const startedAt = new Date();

    try {
      const heartbeatBefore = new Date(
        startedAt.getTime() - TecnicoTrackingExpirationScheduler.STALE_AFTER_MS,
      );

      this.logger.log(
        [
          'Iniciando revisión de sesiones de tracking expiradas.',
          `heartbeatBefore=${heartbeatBefore.toISOString()}`,
        ].join(' '),
      );

      const result = await this.expirarTracking.execute({
        heartbeatBefore,

        limit: 500,
      });

      if (result.encontradas === 0) {
        this.logger.log(
          'No se encontraron sesiones de tracking pendientes de expiración.',
        );

        return;
      }

      this.logger.log(
        [
          'Revisión de tracking completada.',
          `encontradas=${result.encontradas}`,
          `expiradas=${result.expiradas}`,
          `omitidasPorConcurrencia=${result.omitidasPorConcurrencia}`,
        ].join(' '),
      );
    } catch (error) {
      this.logger.error(
        'Falló la revisión automática de sesiones de tracking.',
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
