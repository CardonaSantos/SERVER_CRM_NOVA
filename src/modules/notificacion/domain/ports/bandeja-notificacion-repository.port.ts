export const BANDEJA_NOTIFICACION_REPOSITORY = Symbol(
  'BANDEJA_NOTIFICACION_REPOSITORY',
);

/**
 * Estado de cada notificación para cada usuario (leída, descartada). Solo
 * toca las notificaciones de la bandeja de ese usuario que no descartó.
 */
export interface BandejaNotificacionRepositoryPort {
  /** `false` si la notificación no está en su bandeja. Repetir no es error. */
  marcarLeida(
    usuarioId: number,
    notificacionId: number,
    fecha: Date,
  ): Promise<boolean>;

  /** Cuántas pasaron a leídas. */
  marcarTodasLeidas(usuarioId: number, fecha: Date): Promise<number>;

  /** `false` si la notificación no está en su bandeja. */
  descartar(
    usuarioId: number,
    notificacionId: number,
    fecha: Date,
  ): Promise<boolean>;

  /** Cuántas se descartaron. */
  descartarTodas(usuarioId: number, fecha: Date): Promise<number>;
}
