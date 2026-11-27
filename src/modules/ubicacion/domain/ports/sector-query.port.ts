import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';
import {
  SectorFiltros,
  SectorListItem,
  SectorOpcion,
} from '../read-models/sector-listado.read-model';

export const SECTOR_QUERY = Symbol('SECTOR_QUERY');

/** Ninguna consulta devuelve sectores eliminados. */
export interface SectorQueryPort {
  findMany(
    filtros: SectorFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<SectorListItem>>;

  findDetail(id: number): Promise<SectorListItem | null>;

  /** Por nombre. */
  findOpciones(municipioId?: number): Promise<SectorOpcion[]>;
}
