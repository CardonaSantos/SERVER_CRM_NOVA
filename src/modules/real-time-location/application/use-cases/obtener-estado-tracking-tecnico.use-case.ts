import { Inject, Injectable } from '@nestjs/common';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionInconsistenteError,
} from '../../domain/errors/real-time-location.errors';
import {
  TECNICO_TRACKING_REPOSITORY,
  TecnicoTrackingRepositoryPort,
} from '../../domain/ports/tecnico-tracking-repository.port';

export type ObtenerEstadoTrackingTecnicoInput = {
  /** El técnico autenticado. */
  tecnicoId: number;
};

export type ObtenerEstadoTrackingTecnicoResult =
  | {
      activo: false;
      sesionTrackingId: null;
      asistenciaId: null;
      estado: null;
      iniciadoEn: null;
      ultimoHeartbeatEn: null;
    }
  | {
      activo: true;
      sesionTrackingId: number;
      asistenciaId: number;
      estado: EstadoTrackingTecnico;
      iniciadoEn: Date;
      ultimoHeartbeatEn: Date;
    };

@Injectable()
export class ObtenerEstadoTrackingTecnicoUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly sesiones: TecnicoTrackingRepositoryPort,
  ) {}

  async execute(
    input: ObtenerEstadoTrackingTecnicoInput,
  ): Promise<ObtenerEstadoTrackingTecnicoResult> {
    if (!Number.isInteger(input.tecnicoId) || input.tecnicoId <= 0) {
      throw new TrackingDatosInvalidosError(
        'El técnico autenticado no es válido.',
      );
    }

    const activa = await this.sesiones.findActiveSessionByTechnician(
      input.tecnicoId,
    );

    if (!activa) {
      return {
        activo: false,
        sesionTrackingId: null,
        asistenciaId: null,
        estado: null,
        iniciadoEn: null,
        ultimoHeartbeatEn: null,
      };
    }

    if (!activa.id) {
      throw new TrackingSesionInconsistenteError(
        'La sesión activa no posee un identificador persistido.',
      );
    }

    if (!activa.asistenciaId) {
      throw new TrackingSesionInconsistenteError(
        'La sesión activa no posee una asistencia asociada.',
      );
    }

    return {
      activo: true,
      sesionTrackingId: activa.id,
      asistenciaId: activa.asistenciaId,
      estado: activa.estado,
      iniciadoEn: activa.iniciadoEn,
      ultimoHeartbeatEn: activa.ultimoHeartbeatEn,
    };
  }
}
