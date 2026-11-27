export const REAUTENTICACION_OPERADOR_SERVICIO = Symbol(
  'REAUTENTICACION_OPERADOR_SERVICIO',
);

/** Confirma la identidad del operador antes de una operación sensible. */
export interface ReautenticacionOperadorPort {
  /**
   * Resuelve si hay un step-up vigente o la contraseña es válida; si no,
   * lanza 401. La contraseña no sale de este puerto.
   */
  confirmar(usuarioId: number, contrasenaActual: string): Promise<void>;
}
