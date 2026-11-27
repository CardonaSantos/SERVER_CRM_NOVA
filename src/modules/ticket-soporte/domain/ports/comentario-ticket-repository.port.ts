import { ComentarioTicketEntity } from '../entities/comentario-ticket.entity';

export const COMENTARIO_TICKET_REPOSITORY = Symbol(
  'COMENTARIO_TICKET_REPOSITORY',
);

export interface ComentarioTicketRepositoryPort {
  /**
   * Guarda el comentario con sus imágenes en el orden dado y marca actividad
   * en el ticket.
   */
  create(
    comentario: ComentarioTicketEntity,
    mediaIds: number[],
  ): Promise<ComentarioTicketEntity>;

  findById(id: number): Promise<ComentarioTicketEntity | null>;

  /** Persiste el borrado lógico; falla si otro lo borró antes. */
  marcarEliminado(comentario: ComentarioTicketEntity): Promise<void>;
}
