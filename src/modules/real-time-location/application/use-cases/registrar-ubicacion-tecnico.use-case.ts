import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';

import { UbicacionTecnicoEntity } from '../../domain/entities/ubicacion-tecnico.entity';

import { TecnicoTrackingRepositoryPort } from '../../domain/ports/tecnico-tracking.repository.port';
import {
  TECNICO_TRACKING_QUERY,
  TECNICO_TRACKING_REALTIME,
  TECNICO_TRACKING_REPOSITORY,
} from '../../infra/tokens/tokens';
import { TecnicoTrackingQueryPort } from '../../domain/ports/TecnicoTrackingQueryPort.port';
import { TecnicoTrackingRealtimePort } from '../../domain/ports/tecnico-tracking-realtime.port';

export type RegistrarUbicacionTecnicoCommand = {
  tecnicoId: number;

  actorRol: string;

  sesionTrackingId: number;

  latitud: number;
  longitud: number;

  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  capturadoEn: string | Date;
};

export type RegistrarUbicacionTecnicoResult = {
  ubicacionId: number;

  sesionTrackingId: number;

  estado: string;

  capturadoEn: Date;

  recibidoEn: Date;

  ultimoHeartbeatEn: Date;
};

@Injectable()
export class RegistrarUbicacionTecnicoUseCase {
  private readonly logger = new Logger(RegistrarUbicacionTecnicoUseCase.name);

  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly trackingRepository: TecnicoTrackingRepositoryPort,

    @Inject(TECNICO_TRACKING_QUERY)
    private readonly trackingQuery: TecnicoTrackingQueryPort,

    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly trackingRealtime: TecnicoTrackingRealtimePort,
  ) {}

  async execute(
    command: RegistrarUbicacionTecnicoCommand,
  ): Promise<RegistrarUbicacionTecnicoResult> {
    this.validateCommand(command);

    this.assertTechnicianRole(command.actorRol);

    const sesion = await this.trackingRepository.findSessionForTechnician({
      tecnicoId: command.tecnicoId,
      sesionTrackingId: command.sesionTrackingId,
    });

    if (!sesion) {
      throw new NotFoundException(
        'No se encontró una sesión de tracking para el técnico autenticado.',
      );
    }

    if (!sesion.isActiva) {
      throw new ConflictException(
        `La sesión de tracking no está activa. Estado actual: ${sesion.estado}.`,
      );
    }

    const capturadoEn = this.parseCapturedAt(command.capturadoEn);

    const ubicacion = UbicacionTecnicoEntity.create({
      tecnicoId: command.tecnicoId,

      sesionTrackingId: command.sesionTrackingId,

      latitud: command.latitud,
      longitud: command.longitud,

      precision: command.precision ?? null,
      velocidad: command.velocidad ?? null,
      bateria: command.bateria ?? null,

      capturadoEn,
    });

    /*
     * Heartbeat = comunicación confirmada con backend.
     *
     * No usamos capturadoEn porque esa fecha
     * pertenece al dispositivo.
     */
    const recibidoEn = new Date();

    sesion.registrarHeartbeat({
      ocurridoEn: recibidoEn,
    });

    const persisted = await this.trackingRepository.registerLocation({
      sesion,
      ubicacion,
    });

    if (!persisted.applied) {
      throw new ConflictException(
        'La sesión dejó de estar activa mientras se registraba la ubicación.',
      );
    }

    const ubicacionId = persisted.ubicacion.id;

    if (!ubicacionId) {
      throw new ConflictException(
        'La ubicación fue persistida sin identificador.',
      );
    }

    const recibidoPersistido = persisted.ubicacion.creadoEn;

    if (!recibidoPersistido) {
      throw new ConflictException(
        'La ubicación fue persistida sin fecha de recepción.',
      );
    }

    // =====================================================
    // SOCKET - ACTUALIZAR VISTA REALTIME
    // =====================================================

    await this.emitRealtimeLocationSafely(command.tecnicoId);

    return {
      ubicacionId,

      sesionTrackingId: command.sesionTrackingId,

      estado: persisted.sesion.estado,

      capturadoEn,

      recibidoEn: recibidoPersistido,

      ultimoHeartbeatEn: persisted.sesion.ultimoHeartbeatEn,
    };
  }

  private parseCapturedAt(value: string | Date): Date {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(
        'capturadoEn debe contener una fecha válida.',
      );
    }

    return date;
  }

  private assertTechnicianRole(actorRol: string): void {
    const normalizedRole = actorRol.trim().toUpperCase();

    if (normalizedRole === 'TECNICO') {
      return;
    }

    throw new ForbiddenException(
      'Solo un técnico puede registrar su ubicación.',
    );
  }

  private validateCommand(command: RegistrarUbicacionTecnicoCommand): void {
    this.assertPositiveInteger(command.tecnicoId, 'tecnicoId');

    this.assertPositiveInteger(command.sesionTrackingId, 'sesionTrackingId');

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

  private async emitRealtimeLocationSafely(tecnicoId: number): Promise<void> {
    try {
      /*
       * La ubicación ya fue persistida antes de llegar aquí.
       *
       * Construimos ahora la vista enriquecida que consume
       * el mapa administrativo.
       */
      const realtimeView =
        await this.trackingQuery.findRealtimeViewByTechnician(tecnicoId);

      /*
       * Puede ocurrir que un OFF gane la carrera justo
       * después del INSERT del GPS.
       *
       * En ese caso ya no existe una sesión ACTIVA
       * para construir la vista realtime.
       *
       * No es un error de persistencia.
       */
      if (!realtimeView) {
        return;
      }

      await this.trackingRealtime.emitLocationUpdated(realtimeView);
    } catch (error) {
      /*
       * Socket/realtime es un efecto secundario.
       *
       * Nunca convertimos un GPS correctamente persistido
       * en un HTTP 500 solamente porque falló la consulta
       * enriquecida o la emisión Socket.
       *
       * Esto también evita que la APK reintente y pueda
       * insertar innecesariamente el mismo punto otra vez.
       */
      this.logger.error(
        'La ubicación fue persistida, pero no pudo emitirse la actualización realtime.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
