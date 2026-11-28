import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';

import {
  EjecucionTareaFiltros,
  EjecucionTareaListItem,
} from '../read-models/ejecucion-tarea-listado.read-model';

export const EJECUCION_TAREA_QUERY = Symbol('EJECUCION_TAREA_QUERY');

export interface EjecucionTareaQueryPort {
  /** Registro de ejecuciones con filtros; por omisión, la más reciente primero. */
  findMany(
    filtros: EjecucionTareaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<EjecucionTareaListItem>>;
}
