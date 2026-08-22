import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking.repository.port';
import {
  ASISTENCIA_TRACKING_PORT,
  TECNICO_TRACKING_REALTIME,
  TECNICO_TRACKING_REPOSITORY,
} from '../../infra/tokens/tokens';
import { AsistenciaTrackingPort } from '../../domain/ports/asistencia-tracking.port';
import { TecnicoTrackingSesionEntity } from '../../domain/entities/real-time-location.entity';
import { TecnicoTrackingRealtimePort } from '../../domain/ports/tecnico-tracking-realtime.port';

export type FinalizarTecnicoTrackingCommand = {
  /**
   * Identidad obtenida exclusivamente del JWT.
   */
  tecnicoId: number;

  /**
   * Rol obtenido exclusivamente del JWT.
   */
  //   actorRol: string;

  /**
   * Sesión que la APK recibió al encender
   * el tracker.
   */
  sesionTrackingId: number;
};

export type FinalizarTecnicoTrackingResult = {
  sesionTrackingId: number;

  asistenciaId: number;

  estado: EstadoTrackingTecnico;

  iniciadoEn: Date;

  finalizadoEn: Date;

  ultimoHeartbeatEn: Date;

  /**
   * Tiempo confirmado de la sesión cerrada.
   */
  duracionMinutos: number;

  horaEntrada: Date;

  horaSalida: Date;
};

@Injectable()
export class FinalizarTecnicoTrackingUseCase {
  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly trackingRepository: TecnicoTrackingRepositoryPort,

    @Inject(ASISTENCIA_TRACKING_PORT)
    private readonly asistenciaTracking: AsistenciaTrackingPort,

    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly trackingRealtime: TecnicoTrackingRealtimePort,
  ) {}

  async execute(
    command: FinalizarTecnicoTrackingCommand,
  ): Promise<FinalizarTecnicoTrackingResult> {
    this.validateCommand(command);

    // this.assertTechnicianRole(command.actorRol);

    const sesion = await this.trackingRepository.findSessionForTechnician({
      tecnicoId: command.tecnicoId,
      sesionTrackingId: command.sesionTrackingId,
    });

    if (!sesion) {
      throw new NotFoundException(
        'No se encontró la sesión de tracking para el técnico autenticado.',
      );
    }

    const asistenciaId = sesion.asistenciaId;

    if (!asistenciaId) {
      throw new ConflictException(
        'La sesión de tracking no posee una asistencia asociada.',
      );
    }

    /*
     * Una sesión EXPIRADA conserva esa condición.
     *
     * No permitimos que un OFF tardío convierta posteriormente
     * una interrupción anormal en una finalización normal.
     */
    if (sesion.isExpirada) {
      throw new ConflictException(
        'La sesión de tracking ya expiró y no puede finalizarse manualmente.',
      );
    }

    /*
     * Idempotencia.
     *
     * MUY IMPORTANTE:
     * si ya está FINALIZADA, devolvemos la sesión existente
     * sin volver a modificar Asistencia.
     *
     * Esto evita que un retry tardío de una sesión anterior
     * sobrescriba la horaSalida de una jornada que pudo
     * haberse reabierto posteriormente.
     */
    if (sesion.isFinalizada) {
      return this.buildAlreadyFinishedResult(sesion, asistenciaId);
    }

    /*
     * Un OFF explícito es confirmado por el servidor.
     */
    const finalizadoEn = new Date();

    sesion.finalizar({
      finalizadoEn,
    });

    const persisted = await this.trackingRepository.finishTracking({
      sesion,
      asistenciaId,
      horaSalida: finalizadoEn,
    });

    if (persisted.sesion.isExpirada) {
      throw new ConflictException(
        'La sesión expiró mientras se procesaba su finalización.',
      );
    }

    const persistedFinishedAt = persisted.sesion.finalizadoEn;

    if (!persistedFinishedAt) {
      throw new ConflictException(
        'La sesión finalizada no posee fecha de finalización.',
      );
    }

    const horaSalida = persisted.asistencia.horaSalida;

    if (!horaSalida) {
      throw new ConflictException(
        'La asistencia no registró correctamente la hora de salida.',
      );
    }

    // SOCKET - SESIÓN FINALIZADA

    await this.trackingRealtime.emitTrackingStateChanged({
      tecnicoId: command.tecnicoId,

      sesionTrackingId: command.sesionTrackingId,

      asistenciaId: persisted.asistencia.id,

      estado: persisted.sesion.estado,

      iniciadoEn: persisted.sesion.iniciadoEn,

      finalizadoEn: persistedFinishedAt,

      ultimoHeartbeatEn: persisted.sesion.ultimoHeartbeatEn,
    });

    return {
      sesionTrackingId: command.sesionTrackingId,

      asistenciaId: persisted.asistencia.id,

      estado: persisted.sesion.estado,

      iniciadoEn: persisted.sesion.iniciadoEn,

      finalizadoEn: persistedFinishedAt,

      ultimoHeartbeatEn: persisted.sesion.ultimoHeartbeatEn,

      duracionMinutos: this.calculateDurationMinutes(
        persisted.sesion.iniciadoEn,
        persistedFinishedAt,
      ),

      horaEntrada: persisted.asistencia.horaEntrada,

      horaSalida,
    };
  }

  private async buildAlreadyFinishedResult(
    sesion: TecnicoTrackingSesionEntity,
    asistenciaId: number,
  ): Promise<FinalizarTecnicoTrackingResult> {
    const finalizadoEn = sesion.finalizadoEn;

    if (!finalizadoEn) {
      throw new ConflictException(
        'La sesión figura como finalizada pero no posee fecha de finalización.',
      );
    }

    /*
     * Para una repetición HTTP necesitamos recuperar
     * la asistencia sin escribir nuevamente sobre ella.
     */
    const asistencia = await this.asistenciaTracking.findById(asistenciaId);

    if (!asistencia) {
      throw new ConflictException(
        'No se encontró la asistencia asociada a la sesión finalizada.',
      );
    }

    /*
     * Si la jornada fue reabierta posteriormente,
     * horaSalida puede ser null.
     *
     * En ese escenario seguimos devolviendo como instante
     * del OFF de ESTA sesión su propio finalizadoEn.
     */
    const horaSalida = asistencia.horaSalida ?? finalizadoEn;

    return {
      sesionTrackingId: sesion.id!,

      asistenciaId,

      estado: sesion.estado,

      iniciadoEn: sesion.iniciadoEn,

      finalizadoEn,

      ultimoHeartbeatEn: sesion.ultimoHeartbeatEn,

      duracionMinutos: this.calculateDurationMinutes(
        sesion.iniciadoEn,
        finalizadoEn,
      ),

      horaEntrada: asistencia.horaEntrada,

      horaSalida,
    };
  }

  private calculateDurationMinutes(start: Date, end: Date): number {
    const milliseconds = end.getTime() - start.getTime();

    return Math.max(0, Math.floor(milliseconds / 60_000));
  }

  private assertTechnicianRole(actorRol: string): void {
    const normalizedRole = actorRol.trim().toUpperCase();

    if (normalizedRole === 'TECNICO') {
      return;
    }

    throw new ForbiddenException(
      'Solo un técnico puede finalizar su tracking.',
    );
  }

  private validateCommand(command: FinalizarTecnicoTrackingCommand): void {
    this.assertPositiveInteger(command.tecnicoId, 'tecnicoId');

    this.assertPositiveInteger(command.sesionTrackingId, 'sesionTrackingId');

    // if (typeof command.actorRol !== 'string' || !command.actorRol.trim()) {
    //   throw new ForbiddenException(
    //     'No fue posible determinar el rol del usuario autenticado.',
    //   );
    // }
  }

  private assertPositiveInteger(value: number, field: string): void {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BadRequestException(`${field} debe ser un entero positivo.`);
    }
  }
}
