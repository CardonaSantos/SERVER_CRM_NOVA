import { MarcarClienteDesinstaladoInput } from '../application/use-cases/marcar-cliente-desinstalado.use-case';
import { SincronizarEstadoOperativoClienteInput } from '../application/use-cases/sincronizar-estado-operativo-cliente.use-case';

export type {
  MarcarClienteDesinstaladoInput,
  SincronizarEstadoOperativoClienteInput,
};

export const CLIENTE = Symbol('CLIENTE');

/** Único camino para que otro módulo cambie el estado de un cliente. */
export interface ClienteFacadePort {
  /**
   * Refleja el estado que PPPoE confirmó. Idempotente.
   * @throws ClienteNoEncontradoError si no existe, está eliminado o es de otra empresa.
   */
  sincronizarEstadoOperativo(
    input: SincronizarEstadoOperativoClienteInput,
  ): Promise<void>;

  /** Deja al cliente DESINSTALADO. Idempotente. */
  marcarDesinstalado(input: MarcarClienteDesinstaladoInput): Promise<void>;
}
