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

  /**
   * Como `findById`, pero bloquea el comentario hasta que termine la unidad de
   * trabajo: así no queda vacío por dos cambios a la vez.
   */
  bloquear(id: number): Promise<ComentarioTicketEntity | null>;

  /** Guarda el texto editado y marca actividad en el ticket. */
  guardarTexto(comentario: ComentarioTicketEntity): Promise<void>;

  /** Borrado lógico de una imagen; el archivo no se destruye. */
  quitarImagen(
    comentarioId: number,
    imagenId: number,
    usuarioId: number,
    fecha: Date,
  ): Promise<void>;

  /** Persiste el borrado lógico; falla si otro lo borró antes. */
  marcarEliminado(comentario: ComentarioTicketEntity): Promise<void>;
}
