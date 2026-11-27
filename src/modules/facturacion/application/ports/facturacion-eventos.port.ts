export const FACTURACION_EVENTOS = Symbol('FACTURACION_EVENTOS');

export interface FacturacionEventosPort {
  /** Avisa a las pantallas que hubo un cambio. Nunca hace fallar la operación. */
  facturacionCambiada(empresaId: number): Promise<void>;
}
