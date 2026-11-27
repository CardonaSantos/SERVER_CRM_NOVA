import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  ZonaFacturacionFiltros,
  ZonaFacturacionListItem,
  ZonaFacturacionOpcion,
} from '../read-models/zona-facturacion-listado.read-model';

export const ZONA_FACTURACION_QUERY = Symbol('ZONA_FACTURACION_QUERY');

/** Consultas de zonas activas (las eliminadas no aparecen). */
export interface ZonaFacturacionQueryPort {
  findMany(
    filtros: ZonaFacturacionFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ZonaFacturacionListItem>>;

  /** Todas las zonas activas, para combos y filtros. */
  findOpciones(): Promise<ZonaFacturacionOpcion[]>;
}
