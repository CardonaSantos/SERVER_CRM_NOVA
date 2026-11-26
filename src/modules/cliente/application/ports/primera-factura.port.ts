import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';

export const PRIMERA_FACTURA = Symbol('PRIMERA_FACTURA');

export type GenerarPrimeraFactura = {
  clienteId: number;
  empresaId: number;
  nombre: string;
  apellidos: string | null;
  zonaFacturacionId: number;
  servicioInternetId: number;
  ahora: Date;
};

/**
 * La factura con la que nace un cliente. Transitorio: pasará a la fachada de
 * `facturacion`.
 */
export interface PrimeraFacturaPort {
  /**
   * Genera la factura del mes y devuelve la cobranza resultante.
   * @throws ClienteReferenciaInvalidaError si la zona o el plan no existen.
   */
  generar(
    input: GenerarPrimeraFactura,
  ): Promise<{ estadoCobranza: EstadoCobranzaCliente }>;
}
