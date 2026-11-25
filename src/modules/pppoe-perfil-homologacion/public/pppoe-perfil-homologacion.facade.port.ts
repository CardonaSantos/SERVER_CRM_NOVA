import { BuscarPerfilPorRouterServicioParams } from '../domain/ports/perfil-homologacion-repository.port';
import { PerfilHomologacionReadModel } from '../domain/read-models/perfil-homologacion.read-model';

export const PPPOE_PERFIL_HOMOLOGACION = Symbol('PPPOE_PERFIL_HOMOLOGACION');

/** Lectura de homologaciones PPPoE para otros módulos. */
export interface PppoePerfilHomologacionFacadePort {
  /** Activa o no; null si no existe. */
  buscarPorId(id: number): Promise<PerfilHomologacionReadModel | null>;

  /** La homologación activa de ese router y servicio, la que usa una prealta. */
  buscarActivoPorRouterYServicio(
    params: BuscarPerfilPorRouterServicioParams,
  ): Promise<PerfilHomologacionReadModel | null>;
}
