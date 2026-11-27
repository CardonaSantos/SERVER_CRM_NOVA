import {
  ComentarioAjenoError,
  ComentarioImagenNoEncontradaError,
  ComentarioInvalidoError,
  ComentarioNoEncontradoError,
} from '../errors/ticket-soporte.errors';
import {
  ComentarioTicketProps,
  CrearComentarioTicketProps,
} from '../props/comentario-ticket.props';

export const LARGO_MAXIMO_COMENTARIO = 2000;

function exigirLargo(texto: string): void {
  if (texto.length > LARGO_MAXIMO_COMENTARIO) {
    throw new ComentarioInvalidoError('El comentario es demasiado largo.');
  }
}

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
    exigirLargo(texto);

    return new ComentarioTicketEntity({
      id: null,
      ticketId: input.ticketId,
      usuarioId: input.usuarioId,
      texto,
      fechaRegistro: new Date(ahora),
      editadoEn: null,
      imagenIds: [],
      eliminadoEn: null,
      eliminadoPorId: null,
    });
  }

  static hydrate(props: ComentarioTicketProps): ComentarioTicketEntity {
    return new ComentarioTicketEntity({
      ...props,
      imagenIds: [...props.imagenIds],
    });
  }

  get id(): number | null {
    return this.props.id;
  }

  get ticketId(): number {
    return this.props.ticketId;
  }

  /**
   * Solo el autor cambia lo que escribió. Devuelve `false` si el texto es el
   * mismo, y entonces no queda marcado como editado.
   */
  editar(texto: string, usuarioId: number, ahora: Date): boolean {
    if (this.props.eliminadoEn) throw new ComentarioNoEncontradoError();
    if (this.props.usuarioId !== usuarioId) {
      throw new ComentarioAjenoError(
        'Solo puedes editar tus propios comentarios.',
      );
    }

    const nuevo = texto.trim();
    if (nuevo === this.props.texto) return false;
    if (!nuevo && !this.props.imagenIds.length) {
      throw new ComentarioInvalidoError(
        'El comentario no puede quedar vacío: elimínalo si ya no sirve.',
      );
    }
    exigirLargo(nuevo);

    this.props.texto = nuevo;
    this.props.editadoEn = new Date(ahora);

    return true;
  }

  /** Quita una imagen: el autor las suyas y la oficina cualquiera. */
  quitarImagen(imagenId: number, usuarioId: number, gestiona: boolean): void {
    if (this.props.eliminadoEn) throw new ComentarioNoEncontradoError();
    if (!gestiona && this.props.usuarioId !== usuarioId) {
      throw new ComentarioAjenoError();
    }
    if (!this.props.imagenIds.includes(imagenId)) {
      throw new ComentarioImagenNoEncontradaError();
    }
    if (!this.props.texto && this.props.imagenIds.length === 1) {
      throw new ComentarioInvalidoError(
        'Es lo único que tiene el comentario: elimínalo completo.',
      );
    }

    this.props.imagenIds = this.props.imagenIds.filter((id) => id !== imagenId);
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
    return { ...this.props, imagenIds: [...this.props.imagenIds] };
  }
}
