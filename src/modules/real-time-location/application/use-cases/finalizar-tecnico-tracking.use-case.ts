import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { TecnicoTrackingSesionEntity } from '../../domain/entities/tecnico-tracking-sesion.entity';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionEstadoInvalidoError,
  TrackingSesionInconsistenteError,
  TrackingSesionNoEncontradaError,
} from '../../domain/errors/real-time-location.errors';
import {
  ASISTENCIA_TRACKING_QUERY,
  AsistenciaTrackingQueryPort,
} from '../../domain/ports/asistencia-tracking-query.port';
import {
  TECNICO_TRACKING_REPOSITORY,
  TecnicoTrackingRepositoryPort,
} from '../../domain/ports/tecnico-tracking-repository.port';
import { minutosEntre } from '../../domain/policies/metricas-tracking.policy';
import {
  REAL_TIME_LOCATION_TRANSACTION,
  RealTimeLocationTransactionPort,
} from '../ports/real-time-location-transaction.port';
import {
  TECNICO_TRACKING_REALTIME,
  TecnicoTrackingRealtimePort,
} from '../ports/tecnico-tracking-realtime.port';

export type FinalizarTecnicoTrackingInput = {
  /** El técnico autenticado. */
  tecnicoId: number;

  /** Sesión que la app recibió al encender el tracker. */
  sesionTrackingId: number;
};

export type FinalizarTecnicoTrackingResult = {
  sesionTrackingId: number;
  asistenciaId: number;
  estado: EstadoTrackingTecnico;
  iniciadoEn: Date;
  finalizadoEn: Date;
  ultimoHeartbeatEn: Date;

  /** Tiempo confirmado de la sesión cerrada. */
  duracionMinutos: number;

  horaEntrada: Date;
  horaSalida: Date;
};

@Injectable()
export class FinalizarTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly sesiones: TecnicoTrackingRepositoryPort,
    @Inject(ASISTENCIA_TRACKING_QUERY)
    private readonly asistencias: AsistenciaTrackingQueryPort,
    @Inject(REAL_TIME_LOCATION_TRANSACTION)
    private readonly transaccion: RealTimeLocationTransactionPort,
    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly realtime: TecnicoTrackingRealtimePort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: FinalizarTecnicoTrackingInput,
  ): Promise<FinalizarTecnicoTrackingResult> {
    for (const [campo, valor] of [
      ['técnico', input.tecnicoId],
      ['sesión de tracking', input.sesionTrackingId],
    ] as const) {
      if (!Number.isInteger(valor) || valor <= 0) {
        throw new TrackingDatosInvalidosError(
          `El dato de ${campo} no es válido.`,
        );
      }
    }

    const sesion = await this.sesiones.findSessionForTechnician({
      tecnicoId: input.tecnicoId,
      sesionTrackingId: input.sesionTrackingId,
    });

    if (!sesion) throw new TrackingSesionNoEncontradaError();

    const asistenciaId = sesion.asistenciaId;

    if (!asistenciaId) {
      throw new TrackingSesionInconsistenteError(
        'La sesión de tracking no posee una asistencia asociada.',
      );
    }

    // Una sesión EXPIRADA conserva esa condición: un OFF tardío no convierte
    // una interrupción anormal en una finalización normal.
    if (sesion.isExpirada) {
      throw new TrackingSesionEstadoInvalidoError(
        'La sesión de tracking ya expiró y no puede finalizarse manualmente.',
      );
    }

    // Idempotencia: si ya está FINALIZADA se devuelve tal cual, sin volver a
    // escribir la asistencia (un reintento tardío no debe pisar la horaSalida
    // de una jornada que pudo reabrirse).
    if (sesion.isFinalizada) {
      return this.resultadoYaFinalizada(sesion, asistenciaId);
    }

    const finalizadoEn = this.reloj.ahora();

    sesion.finalizar(finalizadoEn);

    const guardado = await this.transaccion.finalizarTracking({
      sesion,
      asistenciaId,
      horaSalida: finalizadoEn,
    });

    if (guardado.sesion.isExpirada) {
      throw new TrackingSesionEstadoInvalidoError(
        'La sesión expiró mientras se procesaba su finalización.',
      );
    }

    const finalizadoPersistido = guardado.sesion.finalizadoEn;
    const horaSalida = guardado.asistencia.horaSalida;

    if (!finalizadoPersistido || !horaSalida) {
      throw new TrackingSesionInconsistenteError(
        'La finalización no registró la fecha de cierre o la hora de salida.',
      );
    }

    await this.realtime.emitTrackingStateChanged({
      tecnicoId: input.tecnicoId,
      sesionTrackingId: input.sesionTrackingId,
      asistenciaId: guardado.asistencia.id,
      estado: guardado.sesion.estado,
      iniciadoEn: guardado.sesion.iniciadoEn,
      finalizadoEn: finalizadoPersistido,
      ultimoHeartbeatEn: guardado.sesion.ultimoHeartbeatEn,
    });

    return {
      sesionTrackingId: input.sesionTrackingId,
      asistenciaId: guardado.asistencia.id,
      estado: guardado.sesion.estado,
      iniciadoEn: guardado.sesion.iniciadoEn,
      finalizadoEn: finalizadoPersistido,
      ultimoHeartbeatEn: guardado.sesion.ultimoHeartbeatEn,
      duracionMinutos: minutosEntre(
        guardado.sesion.iniciadoEn,
        finalizadoPersistido,
      ),
      horaEntrada: guardado.asistencia.horaEntrada,
      horaSalida,
    };
  }

  private async resultadoYaFinalizada(
    sesion: TecnicoTrackingSesionEntity,
    asistenciaId: number,
  ): Promise<FinalizarTecnicoTrackingResult> {
    const finalizadoEn = sesion.finalizadoEn;

    if (!finalizadoEn || !sesion.id) {
      throw new TrackingSesionInconsistenteError(
        'La sesión figura como finalizada pero no posee fecha de finalización.',
      );
    }

    const asistencia = await this.asistencias.findById(asistenciaId);

    if (!asistencia) {
      throw new TrackingSesionInconsistenteError(
        'No se encontró la asistencia asociada a la sesión finalizada.',
      );
    }

    return {
      sesionTrackingId: sesion.id,
      asistenciaId,
      estado: sesion.estado,
      iniciadoEn: sesion.iniciadoEn,
      finalizadoEn,
      ultimoHeartbeatEn: sesion.ultimoHeartbeatEn,
      duracionMinutos: minutosEntre(sesion.iniciadoEn, finalizadoEn),
      horaEntrada: asistencia.horaEntrada,
      // Si la jornada se reabrió, el OFF de ESTA sesión es su propio cierre.
      horaSalida: asistencia.horaSalida ?? finalizadoEn,
    };
  }
}
