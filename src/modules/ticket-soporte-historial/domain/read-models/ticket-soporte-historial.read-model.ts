import { DireccionOrden } from 'src/common/hexagonal/paginacion';
import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';

/** Una entrada del historial tal como se lista y se consulta. */
export type TicketSoporteHistorialResumen = {
  id: number;
  ticketId: number;
  usuarioId: number | null;
  tipo: TicketSoporteHistorialTipo;
  descripcion: string | null;
  usuarioNombre: string | null;
  creadoEn: Date;
};

export type TicketSoporteHistorialFiltros = {
  ticketId?: number;
  usuarioId?: number;
  tipo?: TicketSoporteHistorialTipo;

  /** Busca en la descripción y en el nombre del usuario. */
  search?: string;

  /**
   * `YYYY-MM-DD` = día completo de Guatemala; con hora, el instante exacto
   * (el límite superior incluye ese instante).
   */
  fechaDesde?: string;
  fechaHasta?: string;

  /** Por defecto `desc` (lo más reciente primero). */
  orden?: DireccionOrden;
};
