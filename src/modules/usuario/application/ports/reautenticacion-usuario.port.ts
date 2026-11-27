export const REAUTENTICACION_USUARIO = Symbol('REAUTENTICACION_USUARIO');

/** Confirma la identidad de quien actúa antes de una operación sensible. */
export interface ReautenticacionUsuarioPort {
  /**
   * Resuelve si hay un step-up vigente o la contraseña es válida; si no,
   * lanza 401 como el resto de operaciones sensibles.
   */
  confirmar(usuarioId: number, contrasenaActual: string): Promise<void>;
}
