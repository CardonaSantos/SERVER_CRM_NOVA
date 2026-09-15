import { TicketSoporteHistorialEntity } from '../entities/ticket-soporte-historial.entity';
import {
  TicketSoporteHistorialFindManyFilters,
  TicketSoporteHistorialPaginatedResult,
} from '../read-models/ticket-soporte-historial-list.read-model';

export const TICKET_SOPORTE_HISTORIAL_REPOSITORY = Symbol(
  'TICKET_SOPORTE_HISTORIAL_REPOSITORY',
);

/**
 * Puerto de persistencia append-only.
 *
 * Deliberadamente NO contiene update/delete.
 */
export interface TicketSoporteHistorialRepositoryPort {
  create(
    entity: TicketSoporteHistorialEntity,
  ): Promise<TicketSoporteHistorialEntity>;

  findById(id: number): Promise<TicketSoporteHistorialEntity | null>;

  findPaginated(
    filters: TicketSoporteHistorialFindManyFilters,
  ): Promise<TicketSoporteHistorialPaginatedResult>;
}
