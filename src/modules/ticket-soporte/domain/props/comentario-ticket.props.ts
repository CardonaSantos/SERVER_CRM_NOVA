export type ComentarioTicketProps = {
  id: number | null;
  ticketId: number;
  usuarioId: number;
  /** Vacío cuando el comentario es solo de imágenes. */
  texto: string;
  fechaRegistro: Date;
  /** Última vez que se cambió el texto. */
  editadoEn: Date | null;
  /** Ids de las imágenes vigentes. */
  imagenIds: number[];
  eliminadoEn: Date | null;
  eliminadoPorId: number | null;
};

export type CrearComentarioTicketProps = {
  ticketId: number;
  usuarioId: number;
  texto?: string | null;
  totalImagenes: number;
};
