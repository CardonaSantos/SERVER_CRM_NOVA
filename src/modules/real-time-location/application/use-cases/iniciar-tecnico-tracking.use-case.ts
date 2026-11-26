import { Inject, Injectable } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionInconsistenteError,
} from '../../domain/errors/real-time-location.errors';
import { getTrackingBusinessDate } from '../../domain/policies/fecha-laboral-tracking.policy';
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

export type IniciarTecnicoTrackingInput = {
  /** El técnico autenticado. */
  tecnicoId: number;
};

export type IniciarTecnicoTrackingResult = {
  sesionTrackingId: number;
  asistenciaId: number;
  estado: EstadoTrackingTecnico;
  iniciadoEn: Date;
  ultimoHeartbeatEn: Date;
};

@Injectable()
export class IniciarTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly sesiones: TecnicoTrackingRepositoryPort,
    @Inject(REAL_TIME_LOCATION_TRANSACTION)
    private readonly transaccion: RealTimeLocationTransactionPort,
    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly realtime: TecnicoTrackingRealtimePort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: IniciarTecnicoTrackingInput,
  ): Promise<IniciarTecnicoTrackingResult> {
    if (!Number.isInteger(input.tecnicoId) || input.tecnicoId <= 0) {
      throw new TrackingDatosInvalidosError(
        'El técnico autenticado no es válido.',
      );
    }

    // Idempotencia: si la app perdió la respuesta y vuelve a pedir el inicio,
    // no se crea otra sesión.
    const activa = await this.sesiones.findActiveSessionByTechnician(
      input.tecnicoId,
    );

    if (activa) {
      if (!activa.id || !activa.asistenciaId) {
        throw new TrackingSesionInconsistenteError(
          'La sesión activa no posee una asistencia asociada.',
        );
      }

      await this.realtime.emitTrackingStateChanged({
        tecnicoId: input.tecnicoId,
        sesionTrackingId: activa.id,
        asistenciaId: activa.asistenciaId,
        estado: activa.estado,
        iniciadoEn: activa.iniciadoEn,
        finalizadoEn: activa.finalizadoEn,
        ultimoHeartbeatEn: activa.ultimoHeartbeatEn,
      });

      return {
        sesionTrackingId: activa.id,
        asistenciaId: activa.asistenciaId,
        estado: activa.estado,
        iniciadoEn: activa.iniciadoEn,
        ultimoHeartbeatEn: activa.ultimoHeartbeatEn,
      };
    }

    const iniciadoEn = this.reloj.ahora();

    const resultado = await this.transaccion.iniciarTracking({
      tecnicoId: input.tecnicoId,
      fecha: getTrackingBusinessDate(iniciadoEn),
      iniciadoEn,
    });

    if (!resultado.sesion.id) {
      throw new TrackingSesionInconsistenteError(
        'La sesión de tracking fue creada sin identificador.',
      );
    }

    await this.realtime.emitTrackingStateChanged({
      tecnicoId: input.tecnicoId,
      sesionTrackingId: resultado.sesion.id,
      asistenciaId: resultado.asistencia.id,
      estado: resultado.sesion.estado,
      iniciadoEn: resultado.sesion.iniciadoEn,
      finalizadoEn: resultado.sesion.finalizadoEn,
      ultimoHeartbeatEn: resultado.sesion.ultimoHeartbeatEn,
    });

    return {
      sesionTrackingId: resultado.sesion.id,
      asistenciaId: resultado.asistencia.id,
      estado: resultado.sesion.estado,
      iniciadoEn: resultado.sesion.iniciadoEn,
      ultimoHeartbeatEn: resultado.sesion.ultimoHeartbeatEn,
    };
  }
}
