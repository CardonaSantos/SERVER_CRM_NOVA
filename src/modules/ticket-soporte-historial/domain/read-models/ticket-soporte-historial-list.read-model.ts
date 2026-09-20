import { TicketSoporteHistorialEntity } from '../entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialTipo } from '../enums/ticket-soporte-historial-tipo.enum';

export type TicketSoporteHistorialOrdenDireccion = 'asc' | 'desc';

export type TicketSoporteHistorialFindManyFilters = {
  page?: number;
  limit?: number;

  ticketId?: number;
  usuarioId?: number;
  tipo?: TicketSoporteHistorialTipo;

  search?: string | null;

  fechaDesde?: Date | null;
  fechaHasta?: Date | null;

  ordenDireccion?: TicketSoporteHistorialOrdenDireccion;
};

export type TicketSoporteHistorialPaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type TicketSoporteHistorialPaginatedResult = {
  data: TicketSoporteHistorialEntity[];
  meta: TicketSoporteHistorialPaginationMeta;
};
