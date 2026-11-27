import { MetaTicketReadModel } from '../read-models/meta-ticket.read-model';

export const META_TICKET_QUERY = Symbol('META_TICKET_QUERY');

export interface MetaTicketQueryPort {
  /**
   * Todas las metas (de un técnico, si se pide). No pagina: el estado y el
   * avance se calculan después y son pocas filas.
   */
  findMany(filtros: { tecnicoId?: number }): Promise<MetaTicketReadModel[]>;

  findDetail(id: number): Promise<MetaTicketReadModel | null>;

  /** Si existe un usuario activo con ese id. */
  tecnicoActivo(id: number): Promise<boolean>;
}
