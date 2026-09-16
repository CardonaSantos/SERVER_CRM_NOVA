import { ClienteAccesoInternetEntity } from '../entities/ppoe-acceso-internet.entity';

export type BuscarAccesoInternetDelClienteParams = {
  accesoInternetId: number;
  clienteId: number;
};

export type BuscarAccesoInternetPorIdParams = {
  empresaId: number;
  accesoInternetId: number;
};

export type BuscarAccesoPppoePorClienteParams = {
  empresaId: number;
  clienteId: number;
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

  /**
   * Devuelve el acceso PPPoE más reciente del cliente,
   * incluyendo accesos históricos que ya finalizaron en BAJA.
   */
  findPppoeByClienteId(
    params: BuscarAccesoPppoePorClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null>;

  /**
   * Devuelve únicamente el acceso PPPoE vigente del cliente.
   *
   * Se consideran vigentes:
   * - PENDIENTE
   * - CONFIGURANDO
   * - ACTIVO
   * - SUSPENDIDO
   *
   * Un acceso en BAJA pertenece a un ciclo terminado y no debe
   * impedir que el cliente inicie una nueva prealta PPPoE.
   */
  findPppoeVigenteByClienteId(
    params: BuscarAccesoPppoePorClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null>;
}
