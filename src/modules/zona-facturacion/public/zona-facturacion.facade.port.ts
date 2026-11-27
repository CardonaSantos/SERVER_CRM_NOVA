export const ZONA_FACTURACION = Symbol('ZONA_FACTURACION');

export interface ZonaFacturacionFacadePort {
  /**
   * Confirma que se pueden asignar clientes a la zona.
   * @throws ZonaFacturacionNoEncontradaError si no existe.
   * @throws ZonaFacturacionEliminadaError si está eliminada.
   */
  verificarAsignable(zonaId: number): Promise<void>;
}
