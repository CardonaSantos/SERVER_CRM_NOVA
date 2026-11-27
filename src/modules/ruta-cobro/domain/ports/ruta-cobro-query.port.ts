import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  RutaCobroDetalle,
  RutaCobroFiltros,
  RutaCobroResumen,
} from '../read-models/ruta-cobro.read-model';

export const RUTA_COBRO_QUERY = Symbol('RUTA_COBRO_QUERY');

/** Consultas de rutas no eliminadas. */
export interface RutaCobroQueryPort {
  findMany(
    filtros: RutaCobroFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<RutaCobroResumen>>;

  findDetalle(id: number): Promise<RutaCobroDetalle | null>;

  /** Rutas abiertas de un cobrador, la modificada más reciente primero. */
  findAsignadas(cobradorId: number): Promise<RutaCobroResumen[]>;
}
