import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  ServicioAdicionalFiltros,
  ServicioAdicionalListItem,
  ServicioAdicionalOpcion,
} from '../read-models/servicio-adicional-listado.read-model';

export const SERVICIO_ADICIONAL_QUERY = Symbol('SERVICIO_ADICIONAL_QUERY');

/** Ninguna consulta devuelve servicios eliminados. */
export interface ServicioAdicionalQueryPort {
  findMany(
    filtros: ServicioAdicionalFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ServicioAdicionalListItem>>;

  findDetail(id: number): Promise<ServicioAdicionalListItem | null>;

  /** Activos e inactivos, por nombre. */
  findOpciones(): Promise<ServicioAdicionalOpcion[]>;
}
