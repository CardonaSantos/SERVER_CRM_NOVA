export const IMAGEN_COMENTARIO = Symbol('IMAGEN_COMENTARIO');

export type GuardarImagenComentarioInput = {
  empresaId: number;
  clienteId: number | null;
  ticketId: number;
  subidoPorId: number;
  bytes: Buffer;
  mime: string;
  nombreArchivo: string;
};

/** Guarda las imágenes de un comentario en el almacenamiento. */
export interface ImagenComentarioPort {
  /** Devuelve el id de la media creada. */
  guardar(input: GuardarImagenComentarioInput): Promise<number>;

  /** Compensación: borra la media si el comentario no se pudo guardar. */
  eliminar(mediaId: number, empresaId: number): Promise<void>;
}
