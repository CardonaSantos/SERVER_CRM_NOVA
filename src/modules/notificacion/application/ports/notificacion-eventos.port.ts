import { NotificacionProps } from '../../domain/props/notificacion.props';

export const NOTIFICACION_EVENTOS = Symbol('NOTIFICACION_EVENTOS');

export interface NotificacionEventosPort {
  /** Avisa en vivo a los destinatarios. Nunca hace fallar la operación. */
  notificacionCreada(
    notificacion: NotificacionProps & { id: number },
    destinatarioIds: readonly number[],
  ): Promise<void>;
}
