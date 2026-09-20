import { PppoeAuditoriaEntity } from '../entities/pppoe-auditoria.entity';
import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../enums/pppoe-auditoria-enums';
import {
  PppoeAuditoriaFindManyFilters,
  PppoeAuditoriaPaginatedResult,
} from '../read-models/pppoe-auditoria-list.read-model';

export const PPPOE_AUDITORIA_REPOSITORY = Symbol('PPPOE_AUDITORIA_REPOSITORY');

export type PppoeAuditoriaOrdenCampo = 'creadoEn' | 'accion' | 'origen';

export type PppoeAuditoriaOrdenDireccion = 'asc' | 'desc';

export type BuscarAuditoriasPppoeParams = {
  empresaId: number;

  page?: number;
  limit?: number;

  clienteId?: number;
  accesoInternetId?: number;
  cuentaPppoeId?: number;
  perfilHomologacionId?: number;

  instalacionId?: number;
  desinstalacionId?: number;
  operacionId?: number;

  operadorId?: number;

  origen?: OrigenOperacionPppoe;

  accion?: AccionAuditoriaPppoe;

  acciones?: AccionAuditoriaPppoe[];

  creadoDesde?: Date;
  creadoHasta?: Date;

  ordenPor?: PppoeAuditoriaOrdenCampo;

  ordenDireccion?: PppoeAuditoriaOrdenDireccion;

  search?: string | null;

  fechaDesde?: Date | null;
  fechaHasta?: Date | null;
};

export interface PppoeAuditoriaRepositoryPort {
  /**
   * Inserta un evento nuevo en la bitácora.
   *
   * La auditoría es append-only:
   * no se actualiza ni se elimina.
   */
  create(entity: PppoeAuditoriaEntity): Promise<PppoeAuditoriaEntity>;

  /**
   * Recupera una auditoría concreta.
   */
  findById(id: number): Promise<PppoeAuditoriaEntity | null>;

  /**
   * Consulta general para pantallas administrativas,
   * reportes y bitácoras.
   */
  findPaginated(
    params: BuscarAuditoriasPppoeParams,
  ): Promise<PppoeAuditoriaPaginatedResult>;

  /**
   * Historial completo de una cuenta PPPoE.
   *
   * Se usará para mostrar:
   * - prealta
   * - creación del secret
   * - activación
   * - suspensión
   * - reactivación
   * - eliminación
   */
  findByCuentaPppoeId(cuentaPppoeId: number): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Historial funcional asociado a una ejecución
   * de PppoeOperacion.
   */
  findByOperacionId(operacionId: number): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Eventos generados dentro de una instalación.
   */
  findByInstalacionId(instalacionId: number): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Eventos generados dentro de una desinstalación.
   */
  findByDesinstalacionId(
    desinstalacionId: number,
  ): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Historial PPPoE general del cliente.
   *
   * Puede incluir varios accesos, instalaciones,
   * desinstalaciones y cuentas históricas.
   */
  findByClienteId(clienteId: number): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Historial de un acceso concreto.
   */
  findByAccesoInternetId(
    accesoInternetId: number,
  ): Promise<PppoeAuditoriaEntity[]>;

  /**
   * Historial de creación, actualización,
   * activación y desactivación de una homologación.
   */
  findByPerfilHomologacionId(
    perfilHomologacionId: number,
  ): Promise<PppoeAuditoriaEntity[]>;

  /**
   * CONSEGUIR DATOS PAGINADOS
   * @param filters
   */
  findMany(
    filters: PppoeAuditoriaFindManyFilters,
  ): Promise<PppoeAuditoriaPaginatedResult>;
}
