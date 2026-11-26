export const TICKET_FIRMA_MEDIA = Symbol('TICKET_FIRMA_MEDIA');

export type GuardarTicketFirmaMediaInput = {
  empresaId: number;
  clienteId: number;
  ticketId: number;
  conformidadId: number;
  subidoPorId: number;
  bytes: Buffer;
  mimeType: string;
  nombreArchivo: string;
  titulo: string;
  descripcion: string;
};

export type EliminarTicketFirmaMediaInput = {
  mediaId: number;
  empresaId: number;
};

/** Guarda el archivo de la firma en el almacenamiento (Spaces) y lo registra como media. */
export interface TicketFirmaMediaPort {
  /** Devuelve el id de la media creada. */
  guardarFirma(input: GuardarTicketFirmaMediaInput): Promise<number>;

  /** Compensación: borra la media si lo que sigue al guardado falló. */
  eliminarFirma(input: EliminarTicketFirmaMediaInput): Promise<void>;
}
