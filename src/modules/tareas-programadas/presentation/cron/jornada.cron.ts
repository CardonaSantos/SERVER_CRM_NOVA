import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { MomentoJornada } from '../../domain/enums/jornada.enum';
import { EjecutarJornadaUseCase } from '../../application/use-cases/ejecutar-jornada.use-case';

const ZONA_HORARIA = { timeZone: 'America/Guatemala' };

/**
 * Jornada a las 10:00 y repaso cada 30 minutos de 10:30 a 17:30, hora de
 * Guatemala (guía de cobranza §4.1). Con `TAREAS_PROGRAMADAS_ACTIVAS`
 * apagado no hacen nada.
 */
@Injectable()
export class JornadaCron {
  private readonly logger = new Logger(JornadaCron.name);

  constructor(private readonly ejecutarJornada: EjecutarJornadaUseCase) {}

  @Cron('0 10 * * *', ZONA_HORARIA)
  async jornada(): Promise<void> {
    await this.correr(MomentoJornada.JORNADA);
  }

  /** 10:30, 11:30 … 17:30. */
  @Cron('30 10-17 * * *', ZONA_HORARIA)
  async repasoMedia(): Promise<void> {
    await this.correr(MomentoJornada.REPASO);
  }

  /** 11:00, 12:00 … 17:00. */
  @Cron('0 11-17 * * *', ZONA_HORARIA)
  async repasoEnPunto(): Promise<void> {
    await this.correr(MomentoJornada.REPASO);
  }

  private async correr(momento: MomentoJornada): Promise<void> {
    try {
      await this.ejecutarJornada.execute({ momento });
    } catch (error) {
      this.logger.error(
        `[JORNADA] No se pudo ejecutar ${momento}`,
        error instanceof Error ? error.stack : undefined,
      );
    }
  }
}
