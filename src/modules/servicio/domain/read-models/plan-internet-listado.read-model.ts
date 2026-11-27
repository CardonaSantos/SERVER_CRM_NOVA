import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { EstadoServicio } from '../enums/estado-servicio.enum';
import { OrdenPlanInternet } from '../enums/orden-plan-internet.enum';

export type PlanInternetFiltros = {
  search?: string;
  estados?: EstadoServicio[];
  sortBy?: OrdenPlanInternet;
  sortDir?: DireccionOrden;
};

export type PlanInternetListItem = {
  id: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
  estado: EstadoServicio;
  creadoEn: Date;
  actualizadoEn: Date;
  /** Clientes no eliminados con este plan. */
  clientes: number;
  /** Nunca se usó: ni clientes (tampoco eliminados) ni historial. */
  eliminable: boolean;
};

export type PlanInternetDetalle = PlanInternetListItem & {
  /** Clientes a los que se les factura: activos y sin desinstalar. */
  clientesFacturables: number;
  uso: {
    clientesEliminados: number;
    accesos: number;
    instalaciones: number;
    desinstalaciones: number;
    homologaciones: number;
  };
};

export type PlanInternetOpcion = {
  id: number;
  nombre: string;
  velocidad: string | null;
  precio: number;
  estado: EstadoServicio;
};
