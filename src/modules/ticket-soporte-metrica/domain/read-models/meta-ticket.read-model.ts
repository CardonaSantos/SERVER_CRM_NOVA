import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { EstadoMetaTicket } from '../enums/estado-meta-ticket.enum';
import { OrdenMetaTicket } from '../enums/orden-meta-ticket.enum';

export type TecnicoMetrica = { id: number; nombre: string; activo: boolean };

export type MetaTicketFiltros = {
  tecnicoId?: number;
  estados?: EstadoMetaTicket[];
  /** Metas que tocan el rango. `YYYY-MM-DD`. */
  desde?: string;
  hasta?: string;
  /** Busca en el título y en el nombre del técnico. */
  search?: string;
  sortBy?: OrdenMetaTicket;
  sortDir?: DireccionOrden;
};

/** Meta tal como está guardada, con su técnico. */
export type MetaTicketReadModel = {
  id: number;
  titulo: string | null;
  tecnico: TecnicoMetrica;
  fechaInicio: string;
  fechaFin: string;
  objetivo: number;
  cancelada: boolean;
  creadoEn: Date;
  actualizadoEn: Date;
};

/** Meta con lo que se calcula desde los tickets. */
export type MetaTicketConAvance = MetaTicketReadModel & {
  avance: number;
  faltantes: number;
  /** Puede pasar de 100. */
  porcentaje: number;
  estado: EstadoMetaTicket;
  diasTotales: number;
  diasTranscurridos: number;
  /** Tickets que se alcanzarían al ritmo actual. */
  proyeccion: number;
};
