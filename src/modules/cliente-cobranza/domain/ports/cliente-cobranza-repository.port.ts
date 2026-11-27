import { EstadoCobranzaCliente } from '../../../cliente/public/cliente.types';

export const CLIENTE_COBRANZA_REPOSITORY = Symbol(
  'CLIENTE_COBRANZA_REPOSITORY',
);

export interface ClienteCobranzaRepositoryPort {
  /**
   * Toma al cliente hasta que termine la unidad de trabajo en curso, para que
   * dos movimientos de sus facturas no se crucen. No falla si no existe.
   */
  bloquear(clienteId: number): Promise<void>;

  /** Escribe solo el estado de cobranza. */
  guardar(clienteId: number, estado: EstadoCobranzaCliente): Promise<void>;
}
