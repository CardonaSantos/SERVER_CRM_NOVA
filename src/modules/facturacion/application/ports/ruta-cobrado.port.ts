export const RUTA_COBRADO = Symbol('RUTA_COBRADO');

/** Lo cobrado de una ruta. Transitorio: pasará a la fachada de `ruta-cobro`. */
export interface RutaCobradoPort {
  /**
   * Suma `monto` (negativo para descontar) a lo cobrado de la ruta.
   * Devuelve `false` si la ruta no existe.
   */
  ajustar(rutaId: number, monto: number): Promise<boolean>;
}
