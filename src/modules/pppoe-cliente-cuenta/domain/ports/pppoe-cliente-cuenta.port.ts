import { ClientePppoeCuentaEntity } from '../entities/ppoe-cliente-cuenta.entity';
import { ClientePppoeCuentaProtegidaInstalacion } from '../read-models/cliente-pppoe-cuenta-protegida-instalacion.read-model';

export const CLIENTE_PPPOE_CUENTA_REPOSITORY = Symbol(
  'CLIENTE_PPPOE_CUENTA_REPOSITORY',
);

export type BuscarCuentaPppoeVigentePorUsuarioParams = {
  empresaId: number;
  usuario: string;
};

export interface ClientePppoeCuentaRepositoryPort {
  /**
   * Persiste una cuenta PPPoE nueva.
   *
   * La cuenta inicia en:
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
   * Es uno de los métodos principales para los
   * flujos de instalación y operación SSH.
   */
  findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<ClientePppoeCuentaEntity | null>;

  /**
   * Busca cualquier cuenta mediante su usuario PPPoE,
   * incluyendo cuentas históricas y terminales.
   */
  findByUsuario(usuario: string): Promise<ClientePppoeCuentaEntity | null>;

  /**
   * Busca una cuenta vigente para el usuario PPPoE
   * dentro de la empresa.
   *
   * ELIMINADA y CANCELADA no se consideran vigentes.
   */
  findVigenteByEmpresaYUsuario(
    params: BuscarCuentaPppoeVigentePorUsuarioParams,
  ): Promise<ClientePppoeCuentaEntity | null>;

  /**
   * Obtiene las cuentas PPPoE vinculadas a una instalación,
   * incluyendo el material cifrado necesario para revelar
   * temporalmente las contraseñas.
   *
   * Este contrato pertenece exclusivamente a la capa interna.
   */
  findProtectedByInstalacionId(
    instalacionId: number,
  ): Promise<ClientePppoeCuentaProtegidaInstalacion[]>;
}
