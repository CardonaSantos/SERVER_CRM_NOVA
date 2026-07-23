import { ClientePppoeCuentaEntity } from '../entities/ppoe-cliente-cuenta.entity';

export const CLIENTE_PPPOE_CUENTA_REPOSITORY = Symbol(
  'CLIENTE_PPPOE_CUENTA_REPOSITORY',
);

export interface ClientePppoeCuentaRepositoryPort {
  /**
   * Persiste una cuenta PPPoE nueva.
   *
   * La cuenta  inicia en:
   * PENDIENTE_ACTIVACION.
   */
  create(entity: ClientePppoeCuentaEntity): Promise<ClientePppoeCuentaEntity>;

  /**
   * Persiste los cambios de estado y fechas
   * realizados mediante los métodos de la entidad.
   */
  update(entity: ClientePppoeCuentaEntity): Promise<ClientePppoeCuentaEntity>;

  /**
   * Busca la cuenta mediante su identificador.
   */
  findById(id: number): Promise<ClientePppoeCuentaEntity | null>;

  /**
   * Busca la cuenta uno a uno correspondiente
   * a un acceso de internet.
   *
   * es uno de los métodos principales para los
   * flujos de instalación y operación SSH.
   */
  findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaEntity | null>;

  /**
   * Busca una cuenta mediante su usuario PPPoE.
   *
   * Sirve para validar duplicados y para operaciones
   * futuras iniciadas con el nombre del secret.
   */
  findByUsuario(usuario: string): Promise<ClientePppoeCuentaEntity | null>;
}
