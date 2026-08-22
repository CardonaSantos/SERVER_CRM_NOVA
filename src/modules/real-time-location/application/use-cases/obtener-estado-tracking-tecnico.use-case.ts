import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking.repository.port';

import { TECNICO_TRACKING_REPOSITORY } from '../../infra/tokens/tokens';

export type ObtenerEstadoTrackingTecnicoCommand = {
  /**
   * Identidad obtenida exclusivamente del JWT.
   */
  tecnicoId: number;

  /**
   * Rol obtenido exclusivamente del JWT.
   */
  actorRol: string;
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
    private readonly trackingRepository: TecnicoTrackingRepositoryPort,
  ) {}

  async execute(
    command: ObtenerEstadoTrackingTecnicoCommand,
  ): Promise<ObtenerEstadoTrackingTecnicoResult> {
    this.validateCommand(command);

    this.assertTechnicianRole(command.actorRol);

    const activeSession =
      await this.trackingRepository.findActiveSessionByTechnician(
        command.tecnicoId,
      );

    if (!activeSession) {
      return {
        activo: false,

        sesionTrackingId: null,
        asistenciaId: null,

        estado: null,

        iniciadoEn: null,
        ultimoHeartbeatEn: null,
      };
    }

    const sesionTrackingId = activeSession.id;

    if (!sesionTrackingId) {
      throw new ConflictException(
        'La sesión activa no posee un identificador persistido.',
      );
    }

    const asistenciaId = activeSession.asistenciaId;

    if (!asistenciaId) {
      throw new ConflictException(
        'La sesión activa no posee una asistencia asociada.',
      );
    }

    return {
      activo: true,

      sesionTrackingId,
      asistenciaId,

      estado: activeSession.estado,

      iniciadoEn: activeSession.iniciadoEn,

      ultimoHeartbeatEn: activeSession.ultimoHeartbeatEn,
    };
  }

  private assertTechnicianRole(actorRol: string): void {
    const normalizedRole = actorRol.trim().toUpperCase();

    if (normalizedRole === 'TECNICO') {
      return;
    }

    throw new ForbiddenException(
      'Solo un técnico puede consultar su estado de tracking.',
    );
  }

  private validateCommand(command: ObtenerEstadoTrackingTecnicoCommand): void {
    if (!Number.isInteger(command.tecnicoId) || command.tecnicoId <= 0) {
      throw new BadRequestException('tecnicoId debe ser un entero positivo.');
    }

    if (typeof command.actorRol !== 'string' || !command.actorRol.trim()) {
      throw new ForbiddenException(
        'No fue posible determinar el rol del usuario autenticado.',
      );
    }
  }
}
