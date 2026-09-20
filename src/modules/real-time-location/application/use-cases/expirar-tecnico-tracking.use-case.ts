import { BadRequestException, Inject, Injectable } from '@nestjs/common';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking.repository.port';
import {
  TECNICO_TRACKING_REALTIME,
  TECNICO_TRACKING_REPOSITORY,
} from '../../infra/tokens/tokens';
import { TecnicoTrackingRealtimePort } from '../../domain/ports/tecnico-tracking-realtime.port';

export type ExpirarTecnicoTrackingCommand = {
  /**
   * Toda sesión ACTIVA cuyo heartbeat sea
   * anterior a esta fecha es candidata.
   */
  heartbeatBefore: Date;

  /**
   * Procesamiento acotado por lote.
   */
  limit?: number;
};

export type ExpirarTecnicoTrackingResult = {
  encontradas: number;

  expiradas: number;

  omitidasPorConcurrencia: number;

  sesionesExpiradas: Array<{
    sesionTrackingId: number;
    asistenciaId: number;

    tecnicoId: number;

    iniciadoEn: Date;

    finalizadoEn: Date;

    ultimoHeartbeatEn: Date;

    duracionMinutos: number;
  }>;
};

@Injectable()
export class ExpirarTecnicoTrackingUseCase {
  private static readonly DEFAULT_LIMIT = 100;
  private static readonly MAX_LIMIT = 500;

  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly trackingRepository: TecnicoTrackingRepositoryPort,

    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly trackingRealtime: TecnicoTrackingRealtimePort,
  ) {}

  async execute(
    command: ExpirarTecnicoTrackingCommand,
  ): Promise<ExpirarTecnicoTrackingResult> {
    const heartbeatBefore = this.parseHeartbeatBefore(command.heartbeatBefore);

    const limit = this.resolveLimit(command.limit);

    const candidatas =
      await this.trackingRepository.findActiveSessionsWithHeartbeatBefore({
        before: heartbeatBefore,
        limit,
      });

    const sesionesExpiradas: ExpirarTecnicoTrackingResult['sesionesExpiradas'] =
      [];

    let omitidasPorConcurrencia = 0;

    for (const sesion of candidatas) {
      /*
       * La consulta ya debería devolver únicamente
       * sesiones ACTIVA, pero mantenemos esta defensa.
       */
      if (!sesion.isActiva) {
        continue;
      }

      const sesionId = sesion.id;
      const asistenciaId = sesion.asistenciaId;

      if (!sesionId || !asistenciaId) {
        /*
         * No podemos cerrar correctamente una sesión
         * que no posee identidad persistida o asistencia.
         *
         * Más adelante esto puede convertirse en
         * observabilidad/log de integridad.
         */
        continue;
      }

      /*
       * Guardamos el heartbeat observado ANTES
       * de modificar la entidad.
       */
      const expectedHeartbeatEn = sesion.ultimoHeartbeatEn;

      /*
       * Regla de dominio:
       *
       * estado       → EXPIRADA
       * finalizadoEn → ultimoHeartbeatEn
       */
      sesion.expirar();

      const result = await this.trackingRepository.expireTracking({
        sesion,

        asistenciaId,

        expectedHeartbeatEn,
      });

      /*
       * Puede ocurrir:
       *
       * 1. encontramos stale a las 10:30;
       * 2. llega GPS a las 10:30:01;
       * 3. repository detecta que heartbeat cambió;
       * 4. NO expira.
       *
       * Esto no es un error.
       */
      if (!result.applied) {
        omitidasPorConcurrencia += 1;
        continue;
      }

      const persistedSession = result.sesion;

      if (
        !persistedSession ||
        !persistedSession.id ||
        !persistedSession.finalizadoEn
      ) {
        throw new Error(
          'La expiración fue aplicada sin devolver una sesión persistida válida.',
        );
      }

      // SOCKET - SESIÓN EXPIRADA

      await this.trackingRealtime.emitTrackingStateChanged({
        tecnicoId: persistedSession.tecnicoId,

        sesionTrackingId: persistedSession.id,

        asistenciaId,

        estado: persistedSession.estado,

        iniciadoEn: persistedSession.iniciadoEn,

        finalizadoEn: persistedSession.finalizadoEn,

        ultimoHeartbeatEn: persistedSession.ultimoHeartbeatEn,
      });

      sesionesExpiradas.push({
        sesionTrackingId: persistedSession.id,

        asistenciaId,

        tecnicoId: persistedSession.tecnicoId,

        iniciadoEn: persistedSession.iniciadoEn,

        finalizadoEn: persistedSession.finalizadoEn,

        ultimoHeartbeatEn: persistedSession.ultimoHeartbeatEn,

        duracionMinutos: this.calculateDurationMinutes(
          persistedSession.iniciadoEn,
          persistedSession.finalizadoEn,
        ),
      });
    }

    return {
      encontradas: candidatas.length,

      expiradas: sesionesExpiradas.length,

      omitidasPorConcurrencia,

      sesionesExpiradas,
    };
  }

  private parseHeartbeatBefore(value: Date): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'heartbeatBefore debe contener una fecha válida.',
      );
    }

    return date;
  }

  private resolveLimit(value?: number): number {
    if (value === undefined) {
      return ExpirarTecnicoTrackingUseCase.DEFAULT_LIMIT;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('limit debe ser un entero positivo.');
    }

    return Math.min(value, ExpirarTecnicoTrackingUseCase.MAX_LIMIT);
  }

  private calculateDurationMinutes(start: Date, end: Date): number {
    const milliseconds = end.getTime() - start.getTime();

    return Math.max(0, Math.floor(milliseconds / 60_000));
  }
}
