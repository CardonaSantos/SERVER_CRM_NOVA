import { VerificarCobroRutaInput } from '../application/use-cases/verificar-cobro-ruta.use-case';

export type { VerificarCobroRutaInput };

export const RUTA_COBRO = Symbol('RUTA_COBRO');

export interface RutaCobroFacadePort {
  /**
   * Confirma que en la ruta se puede cobrar a ese cliente. Llámala dentro de la
   * unidad de trabajo del pago: la ruta no cambiará hasta que termine.
   * Devuelve `false` si la ruta no existe o está eliminada.
   * @throws RutaCobroCerradaError si la ruta no está abierta.
   * @throws RutaCobroClienteAjenoError si el cliente no está en la ruta.
   */
  verificarCobro(input: VerificarCobroRutaInput): Promise<boolean>;
}
