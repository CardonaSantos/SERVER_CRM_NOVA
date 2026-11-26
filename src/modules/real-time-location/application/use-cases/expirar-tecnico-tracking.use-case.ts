import { Inject, Injectable } from '@nestjs/common';
import { TrackingDatosInvalidosError } from '../../domain/errors/real-time-location.errors';
import { minutosEntre } from '../../domain/policies/metricas-tracking.policy';
import {
  TECNICO_TRACKING_REPOSITORY,
  TecnicoTrackingRepositoryPort,
} from '../../domain/ports/tecnico-tracking-repository.port';
import {
  REAL_TIME_LOCATION_TRANSACTION,
  RealTimeLocationTransactionPort,
} from '../ports/real-time-location-transaction.port';
import {
  TECNICO_TRACKING_REALTIME,
  TecnicoTrackingRealtimePort,
} from '../ports/tecnico-tracking-realtime.port';

export type ExpirarTecnicoTrackingInput = {
  /** Toda sesión ACTIVA con el último heartbeat anterior a esta fecha es candidata. */
  heartbeatBefore: Date;

  /** Tamaño del lote; por defecto 100, máximo 500. */
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

const LIMITE_POR_DEFECTO = 100;
const LIMITE_MAXIMO = 500;

@Injectable()
export class ExpirarTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly sesiones: TecnicoTrackingRepositoryPort,
    @Inject(REAL_TIME_LOCATION_TRANSACTION)
    private readonly transaccion: RealTimeLocationTransactionPort,
    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly realtime: TecnicoTrackingRealtimePort,
  ) {}

  async execute(
    input: ExpirarTecnicoTrackingInput,
  ): Promise<ExpirarTecnicoTrackingResult> {
    const before = new Date(input.heartbeatBefore);

    if (Number.isNaN(before.getTime())) {
      throw new TrackingDatosInvalidosError(
        'La fecha límite de heartbeat no es válida.',
      );
    }

    if (
      input.limit !== undefined &&
      (!Number.isInteger(input.limit) || input.limit <= 0)
    ) {
      throw new TrackingDatosInvalidosError(
        'El tamaño del lote debe ser un entero positivo.',
      );
    }

    const candidatas =
      await this.sesiones.findActiveSessionsWithHeartbeatBefore({
        before,
        limit: Math.min(input.limit ?? LIMITE_POR_DEFECTO, LIMITE_MAXIMO),
      });

    const sesionesExpiradas: ExpirarTecnicoTrackingResult['sesionesExpiradas'] =
      [];
    let omitidasPorConcurrencia = 0;

    for (const sesion of candidatas) {
      const asistenciaId = sesion.asistenciaId;

      // Sin identidad persistida o sin asistencia no se puede cerrar bien.
      if (!sesion.isActiva || !sesion.id || !asistenciaId) continue;

      // El heartbeat observado ANTES de transitar: la persistencia comprueba
      // que no haya cambiado.
      const expectedHeartbeatEn = sesion.ultimoHeartbeatEn;

      sesion.expirar();

      const resultado = await this.transaccion.expirarTracking({
        sesion,
        asistenciaId,
        expectedHeartbeatEn,
      });

      // Pudo llegar GPS entre la búsqueda y la expiración: no es un error.
      if (!resultado.applied) {
        omitidasPorConcurrencia += 1;
        continue;
      }

      const expirada = resultado.sesion;

      if (!expirada?.id || !expirada.finalizadoEn) {
        // Error de programación: la persistencia dijo "aplicado" sin sesión válida.
        throw new TrackingDatosInvalidosError(
          'La expiración fue aplicada sin devolver una sesión válida.',
        );
      }

      await this.realtime.emitTrackingStateChanged({
        tecnicoId: expirada.tecnicoId,
        sesionTrackingId: expirada.id,
        asistenciaId,
        estado: expirada.estado,
        iniciadoEn: expirada.iniciadoEn,
        finalizadoEn: expirada.finalizadoEn,
        ultimoHeartbeatEn: expirada.ultimoHeartbeatEn,
      });

      sesionesExpiradas.push({
        sesionTrackingId: expirada.id,
        asistenciaId,
        tecnicoId: expirada.tecnicoId,
        iniciadoEn: expirada.iniciadoEn,
        finalizadoEn: expirada.finalizadoEn,
        ultimoHeartbeatEn: expirada.ultimoHeartbeatEn,
        duracionMinutos: minutosEntre(
          expirada.iniciadoEn,
          expirada.finalizadoEn,
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
}
