import {
  ComentarioAjenoError,
  ComentarioInvalidoError,
  ComentarioNoEncontradoError,
} from '../errors/ticket-soporte.errors';
import {
  ComentarioTicketProps,
  CrearComentarioTicketProps,
} from '../props/comentario-ticket.props';

export const LARGO_MAXIMO_COMENTARIO = 2000;

export class ComentarioTicketEntity {
  private constructor(private props: ComentarioTicketProps) {}

  static create(
    input: CrearComentarioTicketProps,
    ahora: Date,
  ): ComentarioTicketEntity {
    const texto = input.texto?.trim() ?? '';

    if (!texto && input.totalImagenes === 0) {
      throw new ComentarioInvalidoError(
        'Escribe un comentario o adjunta una imagen.',
      );
    }
    if (texto.length > LARGO_MAXIMO_COMENTARIO) {
      throw new ComentarioInvalidoError('El comentario es demasiado largo.');
    }

    return new ComentarioTicketEntity({
      id: null,
      ticketId: input.ticketId,
      usuarioId: input.usuarioId,
      texto,
      fechaRegistro: new Date(ahora),
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  static hydrate(props: ComentarioTicketProps): ComentarioTicketEntity {
    return new ComentarioTicketEntity({ ...props });
  }

  get id(): number | null {
    return this.props.id;
  }

  get ticketId(): number {
    return this.props.ticketId;
  }

  /** Borrado lógico: el autor borra los suyos y la oficina cualquiera. */
  eliminar(usuarioId: number, gestiona: boolean, ahora: Date): void {
    if (this.props.eliminadoEn) throw new ComentarioNoEncontradoError();
    if (!gestiona && this.props.usuarioId !== usuarioId) {
      throw new ComentarioAjenoError();
    }

    this.props.eliminadoEn = new Date(ahora);
    this.props.eliminadoPorId = usuarioId;
  }

  toPrimitives(): ComentarioTicketProps {
    return { ...this.props };
  }
}
