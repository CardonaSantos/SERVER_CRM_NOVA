import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';

import {
  PerfilHomologacionFiltros,
  PerfilHomologacionListItem,
  PerfilHomologacionSeleccionable,
} from '../read-models/perfil-homologacion.read-model';

export const PERFIL_HOMOLOGACION_QUERY = Symbol('PERFIL_HOMOLOGACION_QUERY');

export interface PerfilHomologacionQueryPort {
  /** Activas primero, luego las más recientes. */
  findMany(
    filtros: PerfilHomologacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<PerfilHomologacionListItem>>;

  /** Ordenadas por servicio, router y código. */
  findSeleccionables(
    search: string | null,
  ): Promise<PerfilHomologacionSeleccionable[]>;
}
