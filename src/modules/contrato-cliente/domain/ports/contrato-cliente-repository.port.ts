import { ContratoClienteEntity } from '../entities/contrato-cliente.entity';

export const CONTRATO_CLIENTE_REPOSITORY = Symbol(
  'CONTRATO_CLIENTE_REPOSITORY',
);

export interface ContratoClienteRepositoryPort {
  /** `true` si el cliente existe y no está eliminado. */
  existeClienteVigente(clienteId: number): Promise<boolean>;
  /**
   * Persiste un contrato nuevo.
   * @throws ContratoClienteYaExisteError si el cliente ya tiene uno.
   */
  create(contrato: ContratoClienteEntity): Promise<ContratoClienteEntity>;
}
