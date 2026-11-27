import { EstadoCobranzaCliente } from '../../cliente-cobranza/public/cliente-cobranza.facade.port';
import { GenerarPrimeraFacturaInput } from '../application/use-cases/generar-primera-factura.use-case';

export type { GenerarPrimeraFacturaInput };

export const FACTURACION = Symbol('FACTURACION');

export interface FacturacionFacadePort {
  /**
   * Genera la factura con la que nace un cliente y actualiza su cobranza.
   * Llámala dentro de la unidad de trabajo del alta.
   * @throws FacturacionReferenciaInvalidaError si la zona o el plan no existen.
   */
  generarPrimeraFactura(
    input: GenerarPrimeraFacturaInput,
  ): Promise<{ estadoCobranza: EstadoCobranzaCliente }>;
}
