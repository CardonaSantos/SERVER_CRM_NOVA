import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { TecnicoTrackingUbicacionesPaginatedResult } from '../../domain/ports/tecnico-tracking-query.port';
import { TECNICO_TRACKING_QUERY } from '../../infra/tokens/tokens';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';

export type ListarUbicacionesAsistenciaTrackingCommand = {
  asistenciaId: number;

  sesionTrackingId?: number | null;

  page?: number;
  limit?: number;
};

@Injectable()
export class ListarUbicacionesAsistenciaTrackingUseCase {
  private static readonly DEFAULT_PAGE = 1;

  /*
   * Para recorrido GPS tiene sentido un lote mayor
   * que en una tabla administrativa tradicional.
   */
  private static readonly DEFAULT_LIMIT = 250;

  private static readonly MAX_LIMIT = 1000;

  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly trackingQuery: TecnicoTrackingQueryPort,
  ) {}

  async execute(
    command: ListarUbicacionesAsistenciaTrackingCommand,
  ): Promise<TecnicoTrackingUbicacionesPaginatedResult> {
    this.assertPositiveInteger(command.asistenciaId, 'asistenciaId');

    const sesionTrackingId = this.resolveOptionalPositiveInteger(
      command.sesionTrackingId,
      'sesionTrackingId',
    );

    const page = this.resolvePage(command.page);

    const limit = this.resolveLimit(command.limit);

    return this.trackingQuery.findAttendanceLocations({
      asistenciaId: command.asistenciaId,

      sesionTrackingId,

      page,
      limit,
    });
  }

  private resolvePage(value?: number): number {
    if (value === undefined) {
      return ListarUbicacionesAsistenciaTrackingUseCase.DEFAULT_PAGE;
    }

    this.assertPositiveInteger(value, 'page');

    return value;
  }

  private resolveLimit(value?: number): number {
    if (value === undefined) {
      return ListarUbicacionesAsistenciaTrackingUseCase.DEFAULT_LIMIT;
    }

    this.assertPositiveInteger(value, 'limit');

    return Math.min(
      value,
      ListarUbicacionesAsistenciaTrackingUseCase.MAX_LIMIT,
    );
  }

  private resolveOptionalPositiveInteger(
    value: number | null | undefined,
    field: string,
  ): number | null {
    if (value === undefined || value === null) {
      return null;
    }

    this.assertPositiveInteger(value, field);

    return value;
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
