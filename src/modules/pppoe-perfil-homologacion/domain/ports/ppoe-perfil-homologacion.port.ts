import { PerfilHomologacionEntity } from '../entities/ppoe-perfil-homologacion.entity';
import {
  PerfilHomologacionDetalle,
  PerfilHomologacionFindManyFilters,
  PerfilHomologacionPaginatedResult,
} from '../models/pppoe-perfil-homologacion.read-model';

export type BuscarPerfilPorRouterServicioParams = {
  mikrotikRouterId: number;
  servicioInternetId: number;
};

export type BuscarPerfilPorRouterCodigoParams = {
  mikrotikRouterId: number;
  codigoPerfil: string;
};

export interface PerfilHomologacionRepositoryPort {
  /**
   * Persiste una nueva homologación entre:
   * MikroTik + servicio de internet + código de perfil.
   */
  create(entity: PerfilHomologacionEntity): Promise<PerfilHomologacionEntity>;

  /**
   * Actualiza una homologación existente.
   *
   * Se utilizará después de ejecutar métodos como:
   * - actualizarCodigoPerfil()
   * - activar()
   * - desactivar()
   */
  update(entity: PerfilHomologacionEntity): Promise<PerfilHomologacionEntity>;

  /**
   * Busca una homologación mediante su identificador.
   */
  findById(id: number): Promise<PerfilHomologacionEntity | null>;

  /**
   * Busca la homologación asociada a una combinación concreta,
   * sin importar si está activa o inactiva.
   *
   * Para evitar duplicados y administrar registros
   * previamente desactivados.
   */
  findByRouterAndService(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null>;

  /**
   * Busca únicamente una homologación activa.
   *
   * Este será el método utilizado durante la prealta PPPoE.
   */
  findActiveByRouterAndService(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null>;

  /**
   * Busca una homologación por MikroTik y código de perfil.
   *
   * Se utiliza para evitar que dos servicios del mismo router
   * intenten utilizar el mismo profile de MikroTik.
   */
  findByRouterAndCode(
    params: BuscarPerfilPorRouterCodigoParams,
  ): Promise<PerfilHomologacionEntity | null>;

  /**
   * Obtiene el detalle enriquecido de una homologación.
   */
  findDetailById(id: number): Promise<PerfilHomologacionDetalle | null>;

  /**
   * Lista homologaciones con filtros, relaciones y paginación.
   */
  findMany(
    filters: PerfilHomologacionFindManyFilters,
  ): Promise<PerfilHomologacionPaginatedResult>;
}
