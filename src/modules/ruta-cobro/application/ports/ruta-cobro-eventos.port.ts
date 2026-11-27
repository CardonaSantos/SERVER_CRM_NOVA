export const RUTA_COBRO_EVENTOS = Symbol('RUTA_COBRO_EVENTOS');

export interface RutaCobroEventosPort {
  /** Avisa a las pantallas que la ruta cambió. Nunca hace fallar la operación. */
  rutaCambiada(empresaId: number, rutaId: number): Promise<void>;
}
