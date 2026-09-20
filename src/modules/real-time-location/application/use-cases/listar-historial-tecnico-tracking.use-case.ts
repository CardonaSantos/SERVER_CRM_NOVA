import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import { TecnicoTrackingHistorialPaginatedResult } from '../../domain/ports/tecnico-tracking-query.port';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';
import { TECNICO_TRACKING_QUERY } from '../../infra/tokens/tokens';

export type ListarHistorialTecnicoTrackingCommand = {
  page?: number;
  limit?: number;

  search?: string | null;

  tecnicoId?: number | null;

  fechaDesde?: string | Date | null;
  fechaHasta?: string | Date | null;

  estadoSesion?: EstadoTrackingTecnico | null;
};

@Injectable()
export class ListarHistorialTecnicoTrackingUseCase {
  private static readonly DEFAULT_PAGE = 1;
  private static readonly DEFAULT_LIMIT = 10;
  private static readonly MAX_LIMIT = 100;

  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly trackingQuery: TecnicoTrackingQueryPort,
  ) {}

  async execute(
    command: ListarHistorialTecnicoTrackingCommand,
  ): Promise<TecnicoTrackingHistorialPaginatedResult> {
    const page = this.resolvePage(command.page);

    const limit = this.resolveLimit(command.limit);

    const tecnicoId = this.resolveTechnicianId(command.tecnicoId);

    const fechaDesde = this.parseOptionalDate(command.fechaDesde, 'fechaDesde');

    const fechaHasta = this.parseOptionalDate(command.fechaHasta, 'fechaHasta');

    this.assertValidDateRange(fechaDesde, fechaHasta);

    return this.trackingQuery.findAttendanceHistory({
      page,
      limit,

      search: this.normalizeSearch(command.search),

      tecnicoId,

      fechaDesde,
      fechaHasta,

      estadoSesion: command.estadoSesion ?? null,
    });
  }

  private resolvePage(value?: number): number {
    if (value === undefined) {
      return ListarHistorialTecnicoTrackingUseCase.DEFAULT_PAGE;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('page debe ser un entero positivo.');
    }

    return value;
  }

  private resolveLimit(value?: number): number {
    if (value === undefined) {
      return ListarHistorialTecnicoTrackingUseCase.DEFAULT_LIMIT;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('limit debe ser un entero positivo.');
    }

    return Math.min(value, ListarHistorialTecnicoTrackingUseCase.MAX_LIMIT);
  }

  private resolveTechnicianId(value?: number | null): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException('tecnicoId debe ser un entero positivo.');
    }

    return value;
  }

  private normalizeSearch(value?: string | null): string | null {
    if (value === undefined || value === null) {
      return null;
    }

    const normalized = value.trim();

    return normalized.length > 0 ? normalized : null;
  }

  private parseOptionalDate(
    value: string | Date | null | undefined,
    field: string,
  ): Date | null {
    if (value === undefined || value === null) {
      return null;
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`${field} debe contener una fecha válida.`);
    }

    return date;
  }

  private assertValidDateRange(
    fechaDesde: Date | null,
    fechaHasta: Date | null,
  ): void {
    if (
      fechaDesde &&
      fechaHasta &&
      fechaDesde.getTime() > fechaHasta.getTime()
    ) {
      throw new BadRequestException(
        'fechaDesde no puede ser posterior a fechaHasta.',
      );
    }
  }
}
