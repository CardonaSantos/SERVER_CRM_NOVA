import {
  ExpirarTrackingPersistenceParams,
  ExpirarTrackingPersistenceResult,
  FinalizarTrackingPersistenceParams,
  FinalizarTrackingPersistenceResult,
  IniciarTrackingPersistenceParams,
  IniciarTrackingPersistenceResult,
  RealTimeLocationTransactionPort,
  RegistrarUbicacionTrackingPersistenceParams,
  RegistrarUbicacionTrackingPersistenceResult,
} from '../../application/ports/real-time-location-transaction.port';
import { TecnicoTrackingSesionEntity } from '../../domain/entities/tecnico-tracking-sesion.entity';
import { UbicacionTecnicoEntity } from '../../domain/entities/ubicacion-tecnico.entity';
import { TecnicoTrackingRepositoryFake } from './tecnico-tracking-repository.fake';

/**
 * Emula las escrituras atómicas sobre el repositorio falso: lo que en producción
 * hace una transacción aquí es una escritura en memoria.
 */
export class RealTimeLocationTransactionFake
  implements RealTimeLocationTransactionPort
{
  readonly ubicaciones: UbicacionTecnicoEntity[] = [];
  readonly iniciosPedidos: IniciarTrackingPersistenceParams[] = [];
  readonly cierresPedidos: FinalizarTrackingPersistenceParams[] = [];

  /** Hora de recepción que el "servidor" le pone a cada ubicación. */
  recibidoEn = new Date('2026-11-25T14:30:00.000Z');

  constructor(private readonly sesiones: TecnicoTrackingRepositoryFake) {}

  iniciarTracking(
    params: IniciarTrackingPersistenceParams,
  ): Promise<IniciarTrackingPersistenceResult> {
    this.iniciosPedidos.push(params);

    const nueva = TecnicoTrackingSesionEntity.create({
      tecnicoId: params.tecnicoId,
      asistenciaId: 50,
      iniciadoEn: params.iniciadoEn,
    });
    const sesion = TecnicoTrackingSesionEntity.hydrate({
      ...nueva.toPrimitives(),
      id: this.sesiones.siguienteId++,
    });

    this.sesiones.sesiones.set(sesion.id as number, sesion);

    return Promise.resolve({
      asistencia: {
        id: 50,
        tecnicoId: params.tecnicoId,
        fecha: params.fecha,
        horaEntrada: params.iniciadoEn,
        horaSalida: null,
        minutosTarde: null,
        trabajoCompleto: false,
      },
      sesion,
    });
  }

  finalizarTracking(
    params: FinalizarTrackingPersistenceParams,
  ): Promise<FinalizarTrackingPersistenceResult> {
    this.cierresPedidos.push(params);
    this.sesiones.sesiones.set(params.sesion.id as number, params.sesion);

    return Promise.resolve({
      sesion: params.sesion,
      asistencia: {
        id: params.asistenciaId,
        tecnicoId: params.sesion.tecnicoId,
        fecha: new Date('2026-11-25T00:00:00.000Z'),
        horaEntrada: params.sesion.iniciadoEn,
        horaSalida: params.horaSalida,
        minutosTarde: null,
        trabajoCompleto: false,
      },
    });
  }

  registrarUbicacion(
    params: RegistrarUbicacionTrackingPersistenceParams,
  ): Promise<RegistrarUbicacionTrackingPersistenceResult> {
    const guardada = this.sesiones.sesiones.get(params.sesion.id as number);

    if (!guardada?.isActiva) {
      return Promise.resolve({ applied: false, sesion: null, ubicacion: null });
    }

    const ubicacion = UbicacionTecnicoEntity.hydrate({
      ...params.ubicacion.toPrimitives(),
      id: this.ubicaciones.length + 1,
      creadoEn: this.recibidoEn,
    });

    this.ubicaciones.push(ubicacion);
    this.sesiones.sesiones.set(params.sesion.id as number, params.sesion);

    return Promise.resolve({
      applied: true,
      sesion: params.sesion,
      ubicacion,
    });
  }

  expirarTracking(
    params: ExpirarTrackingPersistenceParams,
  ): Promise<ExpirarTrackingPersistenceResult> {
    const guardada = this.sesiones.sesiones.get(params.sesion.id as number);

    // Compare-and-swap: si el heartbeat cambió o ya se cerró, no se expira.
    if (
      !guardada?.isActiva ||
      guardada.ultimoHeartbeatEn.getTime() !==
        params.expectedHeartbeatEn.getTime()
    ) {
      return Promise.resolve({
        applied: false,
        sesion: null,
        asistencia: null,
      });
    }

    this.sesiones.sesiones.set(params.sesion.id as number, params.sesion);

    return Promise.resolve({
      applied: true,
      sesion: params.sesion,
      asistencia: null,
    });
  }
}
