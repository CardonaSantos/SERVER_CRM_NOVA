export const REFERENCIA_RUTA_QUERY = Symbol('REFERENCIA_RUTA_QUERY');

/** Datos de otros módulos que una ruta necesita comprobar (solo lectura). */
export interface ReferenciaRutaQueryPort {
  existeCobradorActivo(usuarioId: number): Promise<boolean>;

  /** Cuántos de esos ids son clientes que existen y no están eliminados. */
  contarClientesAsignables(clienteIds: number[]): Promise<number>;
}
