import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TrackingDatosInvalidosError } from '../../domain/errors/real-time-location.errors';
import {
  TECNICO_TRACKING_QUERY,
  TecnicoTrackingQueryPort,
} from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingHistorialListItem } from '../../domain/read-models/tecnico-tracking.read-model';

export type ListarHistorialTecnicoTrackingInput = {
  page?: number;
  limit?: number;

  /** Nombre, correo o teléfono del técnico. */
  search?: string | null;
  tecnicoId?: number | null;

  /** Fechas ISO 8601. */
  fechaDesde?: string | null;
  fechaHasta?: string | null;

  estadoSesion?: EstadoTrackingTecnico | null;
};

@Injectable()
export class ListarHistorialTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly consulta: TecnicoTrackingQueryPort,
  ) {}

  execute(
    input: ListarHistorialTecnicoTrackingInput,
  ): Promise<ResultadoPaginado<TecnicoTrackingHistorialListItem>> {
    const fechaDesde = this.fecha(input.fechaDesde, 'fechaDesde');
    const fechaHasta = this.fecha(input.fechaHasta, 'fechaHasta');

    if (
      fechaDesde &&
      fechaHasta &&
      fechaDesde.getTime() > fechaHasta.getTime()
    ) {
      throw new TrackingDatosInvalidosError(
        'La fecha inicial no puede ser posterior a la final.',
      );
    }

    return this.consulta.findAttendanceHistory(
      {
        search: input.search?.trim() || null,
        tecnicoId: input.tecnicoId ?? null,
        fechaDesde,
        fechaHasta,
        estadoSesion: input.estadoSesion ?? null,
      },
      normalizarPaginacion(input),
    );
  }

  private fecha(valor: string | null | undefined, campo: string): Date | null {
    if (valor === undefined || valor === null) return null;

    const fecha = new Date(valor);

    if (Number.isNaN(fecha.getTime())) {
      throw new TrackingDatosInvalidosError(`La fecha ${campo} no es válida.`);
    }

    return fecha;
  }
}
