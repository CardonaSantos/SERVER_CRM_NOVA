import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { EstadoServicio } from '../enums/estado-servicio.enum';
import { OrdenServicioAdicional } from '../enums/orden-servicio-adicional.enum';

export type ServicioAdicionalFiltros = {
  search?: string;
  estados?: EstadoServicio[];
  tipoServicioId?: number;
  sortBy?: OrdenServicioAdicional;
  sortDir?: DireccionOrden;
};

export type ServicioAdicionalListItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  precio: number;
  estado: EstadoServicio;
  tipo: { id: number; nombre: string } | null;
  creadoEn: Date;
  actualizadoEn: Date;
  /** Asignaciones a clientes no eliminados. */
  clientes: number;
  /** Nunca se usó: ni asignaciones ni líneas de factura. */
  eliminable: boolean;
};

export type ServicioAdicionalOpcion = {
  id: number;
  nombre: string;
  precio: number;
  estado: EstadoServicio;
};
