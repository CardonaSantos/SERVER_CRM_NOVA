import { Inject, Injectable, Logger } from '@nestjs/common';
import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';
import { UbicacionTecnicoEntity } from '../../domain/entities/ubicacion-tecnico.entity';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';
import {
  TrackingDatosInvalidosError,
  TrackingSesionEstadoInvalidoError,
  TrackingSesionInconsistenteError,
  TrackingSesionNoEncontradaError,
} from '../../domain/errors/real-time-location.errors';
import {
  TECNICO_TRACKING_QUERY,
  TecnicoTrackingQueryPort,
} from '../../domain/ports/tecnico-tracking-query.port';
import {
  TECNICO_TRACKING_REPOSITORY,
  TecnicoTrackingRepositoryPort,
} from '../../domain/ports/tecnico-tracking-repository.port';
import {
  REAL_TIME_LOCATION_TRANSACTION,
  RealTimeLocationTransactionPort,
} from '../ports/real-time-location-transaction.port';
import {
  TECNICO_TRACKING_REALTIME,
  TecnicoTrackingRealtimePort,
} from '../ports/tecnico-tracking-realtime.port';

export type RegistrarUbicacionTecnicoInput = {
  /** El técnico autenticado. */
  tecnicoId: number;
  sesionTrackingId: number;
  latitud: number;
  longitud: number;
  precision?: number | null;
  velocidad?: number | null;
  bateria?: number | null;

  /** Instante en que el dispositivo capturó el punto; no se usa como heartbeat. */
  capturadoEn: Date;
};

export type RegistrarUbicacionTecnicoResult = {
  ubicacionId: number;
  sesionTrackingId: number;
  estado: EstadoTrackingTecnico;
  capturadoEn: Date;
  recibidoEn: Date;
  ultimoHeartbeatEn: Date;
};

@Injectable()
export class RegistrarUbicacionTecnicoUseCase {
  private readonly logger = new Logger(RegistrarUbicacionTecnicoUseCase.name);

  constructor(
    @Inject(TECNICO_TRACKING_REPOSITORY)
    private readonly sesiones: TecnicoTrackingRepositoryPort,
    @Inject(REAL_TIME_LOCATION_TRANSACTION)
    private readonly transaccion: RealTimeLocationTransactionPort,
    @Inject(TECNICO_TRACKING_QUERY)
    private readonly consulta: TecnicoTrackingQueryPort,
    @Inject(TECNICO_TRACKING_REALTIME)
    private readonly realtime: TecnicoTrackingRealtimePort,
    @Inject(RELOJ) private readonly reloj: RelojPort,
  ) {}

  async execute(
    input: RegistrarUbicacionTecnicoInput,
  ): Promise<RegistrarUbicacionTecnicoResult> {
    for (const [campo, valor] of [
      ['técnico', input.tecnicoId],
      ['sesión de tracking', input.sesionTrackingId],
    ] as const) {
      if (!Number.isInteger(valor) || valor <= 0) {
        throw new TrackingDatosInvalidosError(
          `El dato de ${campo} no es válido.`,
        );
      }
    }

    const sesion = await this.sesiones.findSessionForTechnician({
      tecnicoId: input.tecnicoId,
      sesionTrackingId: input.sesionTrackingId,
    });

    if (!sesion) throw new TrackingSesionNoEncontradaError();

    if (!sesion.isActiva) {
      throw new TrackingSesionEstadoInvalidoError(
        'La sesión de tracking no está activa.',
      );
    }

    const ubicacion = UbicacionTecnicoEntity.create({
      tecnicoId: input.tecnicoId,
      sesionTrackingId: input.sesionTrackingId,
      latitud: input.latitud,
      longitud: input.longitud,
      precision: input.precision ?? null,
      velocidad: input.velocidad ?? null,
      bateria: input.bateria ?? null,
      capturadoEn: input.capturadoEn,
    });

    // El heartbeat es la comunicación confirmada con el backend: la hora del
    // servidor, no la del dispositivo.
    sesion.registrarHeartbeat(this.reloj.ahora());

    const guardado = await this.transaccion.registrarUbicacion({
      sesion,
      ubicacion,
    });

    if (!guardado.applied) {
      throw new TrackingSesionEstadoInvalidoError(
        'La sesión dejó de estar activa mientras se registraba la ubicación.',
      );
    }

    if (!guardado.ubicacion.id || !guardado.ubicacion.creadoEn) {
      throw new TrackingSesionInconsistenteError(
        'La ubicación fue persistida sin identificador o sin fecha de recepción.',
      );
    }

    await this.emitirRealtimeSinFallar(input.tecnicoId);

    return {
      ubicacionId: guardado.ubicacion.id,
      sesionTrackingId: input.sesionTrackingId,
      estado: guardado.sesion.estado,
      capturadoEn: input.capturadoEn,
      recibidoEn: guardado.ubicacion.creadoEn,
      ultimoHeartbeatEn: guardado.sesion.ultimoHeartbeatEn,
    };
  }

  /**
   * El socket es un efecto secundario: una ubicación ya guardada nunca se
   * convierte en 500 porque falló la vista enriquecida o la emisión (la app
   * reintentaría y duplicaría el punto).
   */
  private async emitirRealtimeSinFallar(tecnicoId: number): Promise<void> {
    try {
      const vista = await this.consulta.findRealtimeViewByTechnician(tecnicoId);

      // Un OFF pudo ganar la carrera justo después del INSERT: ya no hay sesión activa.
      if (!vista) return;

      await this.realtime.emitLocationUpdated(vista);
    } catch (error) {
      this.logger.error(
        'La ubicación fue persistida, pero no pudo emitirse la actualización realtime.',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }
}
