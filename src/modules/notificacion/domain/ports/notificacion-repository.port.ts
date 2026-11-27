import { NotificacionEntity } from '../entities/notificacion.entity';

export const NOTIFICACION_REPOSITORY = Symbol('NOTIFICACION_REPOSITORY');

export interface NotificacionRepositoryPort {
  /**
   * Guarda la notificación y la deja en la bandeja de cada destinatario, de
   * forma atómica. Devuelve la entidad con su id.
   */
  create(
    notificacion: NotificacionEntity,
    destinatarioIds: readonly number[],
  ): Promise<NotificacionEntity>;
}
