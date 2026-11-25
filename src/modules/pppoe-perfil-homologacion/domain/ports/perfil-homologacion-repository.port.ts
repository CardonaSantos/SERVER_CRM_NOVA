import { PerfilHomologacionEntity } from '../entities/perfil-homologacion.entity';

export const PERFIL_HOMOLOGACION_REPOSITORY = Symbol(
  'PERFIL_HOMOLOGACION_REPOSITORY',
);

export type BuscarPerfilPorRouterServicioParams = {
  mikrotikRouterId: number;
  servicioInternetId: number;
};

export type BuscarPerfilPorRouterCodigoParams = {
  mikrotikRouterId: number;
  codigoPerfil: string;
};

export interface PerfilHomologacionRepositoryPort {
  /** @throws PerfilHomologacionDuplicadoError o PerfilHomologacionCodigoDuplicadoError si otra escritura ganó la carrera. */
  create(entity: PerfilHomologacionEntity): Promise<PerfilHomologacionEntity>;

  /** @throws PerfilHomologacionCodigoDuplicadoError si otra escritura ganó la carrera. */
  update(entity: PerfilHomologacionEntity): Promise<PerfilHomologacionEntity>;

  findById(id: number): Promise<PerfilHomologacionEntity | null>;

  /** Activa o no: sirve para impedir duplicados de router + servicio. */
  findByRouterAndService(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null>;

  /** Solo activa: la que usa la prealta PPPoE. */
  findActiveByRouterAndService(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionEntity | null>;

  /** Dos servicios del mismo router no pueden usar el mismo profile. */
  findByRouterAndCode(
    params: BuscarPerfilPorRouterCodigoParams,
  ): Promise<PerfilHomologacionEntity | null>;
}
