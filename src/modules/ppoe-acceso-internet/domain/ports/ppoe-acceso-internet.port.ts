import { ClienteAccesoInternetEntity } from '../entities/ppoe-acceso-internet.entity';

export type BuscarAccesoInternetDelClienteParams = {
  accesoInternetId: number;
  clienteId: number;
};

export interface ClienteAccesoInternetRepositoryPort {
  /**
   * Persiste un acceso de internet nuevo.
   */
  create(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity>;

  /**
   * Busca un acceso y valida que pertenezca al cliente indicado.
   *
   * Se utilizará cuando una instalación trabaje sobre
   * un acceso previamente existente.
   */
  findByIdForClient(
    params: BuscarAccesoInternetDelClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null>;
}
