export const ZONA_FACTURACION = Symbol('ZONA_FACTURACION');

export interface ZonaFacturacionFacadePort {
  /**
   * Confirma que se pueden asignar clientes a la zona. Llámala dentro de la
   * unidad de trabajo que asigna: la zona no podrá eliminarse hasta que termine.
   * @throws ZonaFacturacionNoEncontradaError si no existe.
   * @throws ZonaFacturacionEliminadaError si está eliminada.
   */
  verificarAsignable(zonaId: number): Promise<void>;
}
