import { TicketSoporteHistorialEntity } from '../entities/ticket-soporte-historial.entity';

export const TICKET_SOPORTE_HISTORIAL_REPOSITORY = Symbol(
  'TICKET_SOPORTE_HISTORIAL_REPOSITORY',
);

/** Persistencia append-only: deliberadamente sin actualizar ni borrar. */
export interface TicketSoporteHistorialRepositoryPort {
  /** Guarda la entrada; dentro de una unidad de trabajo se une a su transacción. */
  create(
    entity: TicketSoporteHistorialEntity,
  ): Promise<TicketSoporteHistorialEntity>;
}
