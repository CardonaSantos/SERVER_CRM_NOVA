export const SESIONES_USUARIO = Symbol('SESIONES_USUARIO');

export type MotivoCierreSesiones = 'USUARIO_INACTIVO' | 'CONTRASENA_CAMBIADA';

/** Cierra sesiones abiertas (y sus sockets). Nunca lanza. */
export interface SesionesUsuarioPort {
  /** @returns Cuántas cerró. */
  cerrarTodas(usuarioId: number, motivo: MotivoCierreSesiones): Promise<number>;

  /** Todas menos `sesionId`. @returns Cuántas cerró. */
  cerrarOtras(
    usuarioId: number,
    sesionId: string,
    motivo: MotivoCierreSesiones,
  ): Promise<number>;
}
