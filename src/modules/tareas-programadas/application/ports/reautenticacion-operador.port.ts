export const REAUTENTICACION_OPERADOR_TAREAS = Symbol(
  'REAUTENTICACION_OPERADOR_TAREAS',
);

/** Confirma la identidad del operador antes de lanzar una tarea a mano. */
export interface ReautenticacionOperadorPort {
  /**
   * Resuelve si hay un step-up vigente o la contraseña es válida; si no,
   * lanza 401. La contraseña no sale de este puerto.
   */
  confirmar(usuarioId: number, contrasenaActual: string): Promise<void>;
}
