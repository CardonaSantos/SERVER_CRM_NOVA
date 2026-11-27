import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { OrdenSector } from '../enums/orden-sector.enum';

export type SectorFiltros = {
  search?: string;
  departamentoId?: number;
  municipioId?: number;
  sortBy?: OrdenSector;
  sortDir?: DireccionOrden;
};

export type SectorListItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  municipio: { id: number; nombre: string };
  departamento: { id: number; nombre: string };
  creadoEn: Date;
  actualizadoEn: Date;
  /** Clientes no eliminados del sector. */
  clientes: number;
  /** No tiene ningún cliente, tampoco eliminado. */
  eliminable: boolean;
};

export type SectorOpcion = {
  id: number;
  nombre: string;
  municipioId: number;
  clientes: number;
};
