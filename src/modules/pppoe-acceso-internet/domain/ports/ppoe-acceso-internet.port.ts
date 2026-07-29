import { ClienteAccesoInternetEntity } from '../entities/ppoe-acceso-internet.entity';

export type BuscarAccesoInternetDelClienteParams = {
  accesoInternetId: number;
  clienteId: number;
};

export type BuscarAccesoInternetPorIdParams = {
  empresaId: number;
  accesoInternetId: number;
};

export interface ClienteAccesoInternetRepositoryPort {
  create(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity>;

  update(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity>;

  findById(
    params: BuscarAccesoInternetPorIdParams,
  ): Promise<ClienteAccesoInternetEntity | null>;

  findByIdForClient(
    params: BuscarAccesoInternetDelClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null>;
}
