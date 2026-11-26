import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import {
  TECNICO_TRACKING_QUERY,
  TecnicoTrackingQueryPort,
} from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingUbicacionListItem } from '../../domain/read-models/tecnico-tracking.read-model';

export type ListarUbicacionesAsistenciaTrackingInput = {
  asistenciaId: number;
  sesionTrackingId?: number | null;
  page?: number;
  limit?: number;
};

/** Para reconstruir el recorrido conviene un lote mayor que en una tabla normal. */
const LIMITE_POR_DEFECTO = 250;
const LIMITE_MAXIMO = 1000;

@Injectable()
export class ListarUbicacionesAsistenciaTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly consulta: TecnicoTrackingQueryPort,
  ) {}

  /** Recorrido GPS de una jornada, en el orden en que el dispositivo capturó los puntos. */
  execute(
    input: ListarUbicacionesAsistenciaTrackingInput,
  ): Promise<ResultadoPaginado<TecnicoTrackingUbicacionListItem>> {
    return this.consulta.findAttendanceLocations(
      {
        asistenciaId: input.asistenciaId,
        sesionTrackingId: input.sesionTrackingId ?? null,
      },
      normalizarPaginacion(input, {
        limitePorDefecto: LIMITE_POR_DEFECTO,
        limiteMaximo: LIMITE_MAXIMO,
      }),
    );
  }
}
