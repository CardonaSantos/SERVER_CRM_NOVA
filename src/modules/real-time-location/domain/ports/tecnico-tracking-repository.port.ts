import { TecnicoTrackingSesionEntity } from '../entities/tecnico-tracking-sesion.entity';

export const TECNICO_TRACKING_REPOSITORY = Symbol(
  'TECNICO_TRACKING_REPOSITORY',
);

export interface TecnicoTrackingRepositoryPort {
  /** La sesión del técnico, o `null` si no existe o es de otro técnico. */
  findSessionForTechnician(params: {
    tecnicoId: number;
    sesionTrackingId: number;
  }): Promise<TecnicoTrackingSesionEntity | null>;

  findActiveSessionByTechnician(
    tecnicoId: number,
  ): Promise<TecnicoTrackingSesionEntity | null>;

  /** Sesiones ACTIVA cuyo último heartbeat es anterior a `before`, las más viejas primero. */
  findActiveSessionsWithHeartbeatBefore(params: {
    before: Date;
    limit: number;
  }): Promise<TecnicoTrackingSesionEntity[]>;
}
