import { TecnicoTrackingSesionEntity } from '../entities/real-time-location.entity';
import { UbicacionTecnicoEntity } from '../entities/ubicacion-tecnico.entity';

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

export interface TecnicoTrackingRepositoryPort {
  findSessionForTechnician(params: {
    tecnicoId: number;
    sesionTrackingId: number;
  }): Promise<TecnicoTrackingSesionEntity | null>;

  findActiveSessionByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingSesionEntity | null>;

  startTracking(
    params: IniciarTrackingPersistenceParams,
  ): Promise<IniciarTrackingPersistenceResult>;

  finishTracking(
    params: FinalizarTrackingPersistenceParams,
  ): Promise<FinalizarTrackingPersistenceResult>;

  registerLocation(
    params: RegistrarUbicacionTrackingPersistenceParams,
  ): Promise<RegistrarUbicacionTrackingPersistenceResult>;

  findActiveSessionsWithHeartbeatBefore(params: {
    before: Date;
    limit: number;
  }): Promise<TecnicoTrackingSesionEntity[]>;

  expireTracking(
    params: ExpirarTrackingPersistenceParams,
  ): Promise<ExpirarTrackingPersistenceResult>;
}
