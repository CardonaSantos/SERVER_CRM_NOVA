import { ClienteAccesoInternetEntity } from '../entities/cliente-acceso-internet.entity';

export const CLIENTE_ACCESO_INTERNET_REPOSITORY = Symbol(
  'CLIENTE_ACCESO_INTERNET_REPOSITORY',
);

export type BuscarAccesoInternetDelClienteParams = {
  accesoInternetId: number;
  clienteId: number;
};

export interface ClienteAccesoInternetRepositoryPort {
  create(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity>;

  /** Persiste estado, fechas de estado, servicio, tecnología y método. */
  update(
    entity: ClienteAccesoInternetEntity,
  ): Promise<ClienteAccesoInternetEntity>;

  findById(
    accesoInternetId: number,
  ): Promise<ClienteAccesoInternetEntity | null>;

  findByIdForClient(
    params: BuscarAccesoInternetDelClienteParams,
  ): Promise<ClienteAccesoInternetEntity | null>;

  /**
   * El acceso PPPoE vigente más reciente del cliente (PENDIENTE,
   * CONFIGURANDO, ACTIVO o SUSPENDIDO). Un acceso en BAJA no cuenta.
   */
  findPppoeVigenteByClienteId(
    clienteId: number,
  ): Promise<ClienteAccesoInternetEntity | null>;
}
