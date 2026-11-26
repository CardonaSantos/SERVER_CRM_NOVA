import { TecnicoTrackingSesionEntity } from '../../domain/entities/tecnico-tracking-sesion.entity';
import { UbicacionTecnicoEntity } from '../../domain/entities/ubicacion-tecnico.entity';

export const REAL_TIME_LOCATION_TRANSACTION = Symbol(
  'REAL_TIME_LOCATION_TRANSACTION',
);

export type RegistrarUbicacionTrackingPersistenceParams = {
  /**
   * La entidad ya debe contener el heartbeat actualizado.
   */
  sesion: TecnicoTrackingSesionEntity;

  ubicacion: UbicacionTecnicoEntity;
};

export type RegistrarUbicacionTrackingPersistenceResult =
  | {
      applied: true;

      sesion: TecnicoTrackingSesionEntity;
      ubicacion: UbicacionTecnicoEntity;
    }
  | {
      /**
       * La sesión dejó de estar ACTIVA antes
       * de completar la escritura.
       *
       * No se insertó ubicación, snapshot ni heartbeat.
       */
      applied: false;

      sesion: null;
      ubicacion: null;
    };

export type FinalizarTrackingPersistenceParams = {
  sesion: TecnicoTrackingSesionEntity;

  asistenciaId: number;

  horaSalida: Date;
};

export type IniciarTrackingPersistenceParams = {
  tecnicoId: number;

  /**
   * Día laboral normalizado.
   */
  fecha: Date;

  iniciadoEn: Date;

  /**
   * Si ya existe asistencia del día, se reutiliza.
   * Si no existe, infraestructura debe crearla.
   */
  asistenciaId?: number | null;
};

export type IniciarTrackingPersistenceResult = {
  asistencia: {
    id: number;
    tecnicoId: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;
    trabajoCompleto: boolean;
  };

  sesion: TecnicoTrackingSesionEntity;
};

export type FinalizarTrackingPersistenceResult = {
  sesion: TecnicoTrackingSesionEntity;

  asistencia: {
    id: number;
    tecnicoId: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;
    trabajoCompleto: boolean;
  };
};

export type ExpirarTrackingPersistenceParams = {
  /**
   * Entidad ya transitada a EXPIRADA
   * mediante sesion.expirar().
   */
  sesion: TecnicoTrackingSesionEntity;

  asistenciaId: number;

  /**
   * Heartbeat que observamos cuando decidimos
   * que la sesión estaba stale.
   *
   * Infraestructura debe comprobar que NO cambió
   * antes de aplicar la expiración.
   */
  expectedHeartbeatEn: Date;
};

export type ExpirarTrackingPersistenceResult = {
  /**
   * false significa que la sesión recuperó actividad
   * o fue cerrada concurrentemente.
   *
   * No es un error.
   */
  applied: boolean;

  sesion: TecnicoTrackingSesionEntity | null;

  asistencia: {
    id: number;
    tecnicoId: number;

    fecha: Date;

    horaEntrada: Date;
    horaSalida: Date | null;

    minutosTarde: number | null;
    trabajoCompleto: boolean;
  } | null;
};

/**
 * Escrituras atómicas del tracking (asistencia + sesión + ubicaciones). La
 * implementación usa transacciones; el caso de uso solo pide la intención.
 */
export interface RealTimeLocationTransactionPort {
  /** Inicia el tracking: reutiliza o crea la asistencia del día y crea la sesión. */
  iniciarTracking(
    params: IniciarTrackingPersistenceParams,
  ): Promise<IniciarTrackingPersistenceResult>;

  /** Cierra la sesión y la jornada (hora de salida) en una sola transacción. */
  finalizarTracking(
    params: FinalizarTrackingPersistenceParams,
  ): Promise<FinalizarTrackingPersistenceResult>;

  /** Guarda la ubicación y el heartbeat de la sesión; `applied: false` si la sesión ya no estaba activa. */
  registrarUbicacion(
    params: RegistrarUbicacionTrackingPersistenceParams,
  ): Promise<RegistrarUbicacionTrackingPersistenceResult>;

  /** Expira la sesión si su heartbeat no cambió; `applied: false` si recuperó actividad o se cerró. */
  expirarTracking(
    params: ExpirarTrackingPersistenceParams,
  ): Promise<ExpirarTrackingPersistenceResult>;
}
