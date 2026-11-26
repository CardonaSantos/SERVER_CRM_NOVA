import { Inject, Injectable } from '@nestjs/common';
import { TrackingAsistenciaNoEncontradaError } from '../../domain/errors/real-time-location.errors';
import {
  TECNICO_TRACKING_QUERY,
  TecnicoTrackingQueryPort,
} from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingAsistenciaDetalle } from '../../domain/read-models/tecnico-tracking.read-model';

export type ObtenerDetalleAsistenciaTrackingInput = {
  asistenciaId: number;
};

@Injectable()
export class ObtenerDetalleAsistenciaTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly consulta: TecnicoTrackingQueryPort,
  ) {}

  /** Jornada de un técnico con sus sesiones de tracking y el resumen de tiempos. */
  async execute(
    input: ObtenerDetalleAsistenciaTrackingInput,
  ): Promise<TecnicoTrackingAsistenciaDetalle> {
    const detalle = await this.consulta.findAttendanceDetail({
      asistenciaId: input.asistenciaId,
    });

    if (!detalle) throw new TrackingAsistenciaNoEncontradaError();

    return detalle;
  }
}
