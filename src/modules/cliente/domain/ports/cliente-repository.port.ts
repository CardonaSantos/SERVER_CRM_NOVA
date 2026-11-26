import { ClienteEntity } from '../entities/cliente.entity';
import { CambioCliente } from '../props/cliente.props';

export const CLIENTE_REPOSITORY = Symbol('CLIENTE_REPOSITORY');

export interface ClienteRepositoryPort {
  /** Incluye los eliminados: cada caso de uso decide qué hacer con ellos. */
  findById(id: number): Promise<ClienteEntity | null>;

  /**
   * Guarda solo los campos que cambiaron. Si cambió el estado operativo, exige
   * que siga siendo el que se leyó.
   * @throws ClienteModificadoError si otro proceso lo cambió antes.
   */
  update(entity: ClienteEntity): Promise<ClienteEntity>;

  /** Anota un renglón en el historial del cliente. */
  registrarCambio(cambio: CambioCliente): Promise<void>;
}
