import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { OrdenCatalogoTicket } from '../enums/orden-ticket.enum';

export type CatalogoTicketFiltros = {
  search?: string;
  sortBy?: OrdenCatalogoTicket;
  sortDir?: DireccionOrden;
};

export type EtiquetaTicketListItem = {
  id: number;
  nombre: string;
  tickets: number;
  creadoEn: Date | null;
};

export type SolucionTicketListItem = {
  id: number;
  nombre: string;
  descripcion: string | null;
  tickets: number;
  creadoEn: Date;
};

export type OpcionesTicket = {
  tecnicos: Array<{ id: number; nombre: string; rol: string }>;
  sectores: Array<{ id: number; nombre: string; municipio: string }>;
  etiquetas: Array<{ id: number; nombre: string }>;
  soluciones: Array<{ id: number; nombre: string; descripcion: string | null }>;
};
