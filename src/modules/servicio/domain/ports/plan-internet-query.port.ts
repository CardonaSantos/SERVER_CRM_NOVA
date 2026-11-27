import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  PlanInternetDetalle,
  PlanInternetFiltros,
  PlanInternetListItem,
  PlanInternetOpcion,
} from '../read-models/plan-internet-listado.read-model';

export const PLAN_INTERNET_QUERY = Symbol('PLAN_INTERNET_QUERY');

/** Ninguna consulta devuelve planes eliminados. */
export interface PlanInternetQueryPort {
  findMany(
    filtros: PlanInternetFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<PlanInternetListItem>>;

  findDetail(id: number): Promise<PlanInternetDetalle | null>;

  /** Activos e inactivos, por nombre. */
  findOpciones(): Promise<PlanInternetOpcion[]>;
}
