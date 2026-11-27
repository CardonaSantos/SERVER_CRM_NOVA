import { EstadoCobranzaCliente } from '../../cliente/public/cliente.types';
import { ActualizarCobranzaClienteInput } from '../application/use-cases/actualizar-cobranza-cliente.use-case';

export type { ActualizarCobranzaClienteInput, EstadoCobranzaCliente };

export const CLIENTE_COBRANZA = Symbol('CLIENTE_COBRANZA');

/**
 * Único camino para que facturación cambie la cobranza de un cliente. Está
 * separado de `cliente` porque `cliente` usa facturación (sin ciclos).
 */
export interface ClienteCobranzaFacadePort {
  /** Dentro de una unidad de trabajo, pone en fila los movimientos del cliente. */
  bloquear(clienteId: number): Promise<void>;

  /** Recalcula la cobranza. No toca el estado operativo. */
  actualizar(
    input: ActualizarCobranzaClienteInput,
  ): Promise<EstadoCobranzaCliente>;
}
