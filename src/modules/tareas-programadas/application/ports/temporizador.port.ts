export const TEMPORIZADOR = Symbol('TEMPORIZADOR');

export type TemporizadorActivo = {
  /** Deja de repetir y espera a que termine la vuelta que esté corriendo. */
  detener(): Promise<void>;
};

/** Repite un trabajo en segundo plano (renovar el arriendo) hasta detenerlo. */
export interface TemporizadorPort {
  /**
   * Llama a `trabajo` cada `intervaloMs`. Una vuelta no empieza mientras la
   * anterior siga corriendo. Nunca impide que el proceso termine.
   */
  repetir(
    intervaloMs: number,
    trabajo: () => Promise<void>,
  ): TemporizadorActivo;
}
