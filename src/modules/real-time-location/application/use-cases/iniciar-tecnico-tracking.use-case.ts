import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
} from '@nestjs/common';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking.repository.port';

import { getTrackingBusinessDate } from '../helpers/tracking-date.helper';
import { TECNICO_TRACKING_REPOSITORY } from '../../infra/tokens/tokens';

import { TecnicoTrackingRealtimePort } from '../../domain/ports/tecnico-tracking-realtime.port';

import { TECNICO_TRACKING_REALTIME } from '../../infra/tokens/tokens';

export type IniciarTecnicoTrackingCommand = {
  /**
   * Identidad obtenida exclusivamente del JWT.
   */
  tecnicoId: number;

  /**
   * Rol obtenido exclusivamente del JWT.
   */
  actorRol: string;

  iniciadoEn?: Date;
};

export type IniciarTecnicoTrackingResult = {
  sesionTrackingId: number;

  asistenciaId: number;

  estado: string;

  iniciadoEn: Date;

  ultimoHeartbeatEn: Date;
};

@Injectable()
export class IniciarTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly trackingRepository: TecnicoTrackingRepositoryPort,

    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly trackingRealtime: TecnicoTrackingRealtimePort,
  ) {}

  async execute(
    command: IniciarTecnicoTrackingCommand,
  ): Promise<IniciarTecnicoTrackingResult> {
    this.validateCommand(command);

    this.assertTechnicianRole(command.actorRol);

    const iniciadoEn = this.resolveStartedAt(command.iniciadoEn);

    /*
     * Idempotencia.
     *
     * Si la APK perdió la respuesta HTTP y vuelve
     * a solicitar inicio, no creamos otra sesión.
     */
    const activeSession =
      await this.trackingRepository.findActiveSessionByTechnician(
        command.tecnicoId,
      );

    if (activeSession) {
      const asistenciaId = activeSession.asistenciaId;

      if (!asistenciaId) {
        throw new ConflictException(
          'La sesión activa no posee una asistencia asociada.',
        );
      }

      if (!activeSession.id) {
        throw new ConflictException(
          'La sesión activa no posee un identificador persistido.',
        );
      }

      // ============================================
      // SOCKET - SESIÓN ACTIVA EXISTENTE
      // ============================================

      await this.trackingRealtime.emitTrackingStateChanged({
        tecnicoId: command.tecnicoId,

        sesionTrackingId: activeSession.id,

        asistenciaId,

        estado: activeSession.estado,

        iniciadoEn: activeSession.iniciadoEn,

        finalizadoEn: activeSession.finalizadoEn,

        ultimoHeartbeatEn: activeSession.ultimoHeartbeatEn,
      });

      return {
        sesionTrackingId: activeSession.id,

        asistenciaId,

        estado: activeSession.estado,

        iniciadoEn: activeSession.iniciadoEn,

        ultimoHeartbeatEn: activeSession.ultimoHeartbeatEn,
      };
    }

    const fecha = getTrackingBusinessDate(iniciadoEn);

    const result = await this.trackingRepository.startTracking({
      tecnicoId: command.tecnicoId,

      fecha,

      iniciadoEn,
    });

    const sesionId = result.sesion.id;

    if (!sesionId) {
      throw new ConflictException(
        'La sesión de tracking fue creada sin identificador.',
      );
    }

    // ============================================
    // SOCKET - NUEVA SESIÓN ACTIVA
    // ============================================

    await this.trackingRealtime.emitTrackingStateChanged({
      tecnicoId: command.tecnicoId,

      sesionTrackingId: sesionId,

      asistenciaId: result.asistencia.id,

      estado: result.sesion.estado,

      iniciadoEn: result.sesion.iniciadoEn,

      finalizadoEn: result.sesion.finalizadoEn,

      ultimoHeartbeatEn: result.sesion.ultimoHeartbeatEn,
    });

    return {
      sesionTrackingId: sesionId,

      asistenciaId: result.asistencia.id,

      estado: result.sesion.estado,

      iniciadoEn: result.sesion.iniciadoEn,

      ultimoHeartbeatEn: result.sesion.ultimoHeartbeatEn,
    };
  }

  private resolveStartedAt(value?: Date): Date {
    if (value === undefined) {
      return new Date();
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'iniciadoEn debe contener una fecha válida.',
      );
    }

    return date;
  }

  private assertTechnicianRole(actorRol: string): void {
    const normalizedRole = actorRol.trim().toUpperCase();

    if (normalizedRole === 'TECNICO') {
      return;
    }

    throw new ForbiddenException('Solo un técnico puede iniciar el tracking.');
  }

  private validateCommand(command: IniciarTecnicoTrackingCommand): void {
    this.assertPositiveInteger(command.tecnicoId, 'tecnicoId');

    if (typeof command.actorRol !== 'string' || !command.actorRol.trim()) {
      throw new ForbiddenException(
        'No fue posible determinar el rol del usuario autenticado.',
      );
    }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
