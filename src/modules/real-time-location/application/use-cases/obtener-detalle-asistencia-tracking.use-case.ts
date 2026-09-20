import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { TecnicoTrackingAsistenciaDetalle } from '../../domain/ports/tecnico-tracking-query.port';
import { TECNICO_TRACKING_QUERY } from '../../infra/tokens/tokens';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';

export type ObtenerDetalleAsistenciaTrackingCommand = {
  asistenciaId: number;
};

@Injectable()
export class ObtenerDetalleAsistenciaTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly trackingQuery: TecnicoTrackingQueryPort,
  ) {}

  async execute(
    command: ObtenerDetalleAsistenciaTrackingCommand,
  ): Promise<TecnicoTrackingAsistenciaDetalle> {
    this.validateCommand(command);

    const detail = await this.trackingQuery.findAttendanceDetail({
      asistenciaId: command.asistenciaId,
    });

    if (!detail) {
      throw new NotFoundException('No se encontró la asistencia solicitada.');
    }

    return detail;
  }

  private validateCommand(
    command: ObtenerDetalleAsistenciaTrackingCommand,
  ): void {
    if (!Number.isInteger(command.asistenciaId) || command.asistenciaId <= 0) {
      throw new BadRequestException(
        'asistenciaId debe ser un entero positivo.',
      );
    }
  }
}
