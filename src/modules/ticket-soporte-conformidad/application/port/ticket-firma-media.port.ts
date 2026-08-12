export const TICKET_FIRMA_MEDIA_PORT = Symbol('TICKET_FIRMA_MEDIA_PORT');

export interface GuardarTicketFirmaMediaInput {
  empresaId: number;

  clienteId: number;

  /**
   * Firma pública del cliente:
   * null.
   *
   * Firma del técnico:
   * usuario autenticado.
   */
  subidoPorId?: number | null;

  bytes: Buffer;

  mimeType: string;

  nombreArchivo: string;

  titulo?: string | null;

  descripcion?: string | null;
}

export interface GuardarTicketFirmaMediaOutput {
  mediaId: number;

  bucket: string;

  key: string;

  cdnUrl: string | null;
}

export interface EliminarTicketFirmaMediaInput {
  mediaId: number;

  empresaId: number;
}

export interface TicketFirmaMediaPort {
  guardarFirma(
    input: GuardarTicketFirmaMediaInput,
  ): Promise<GuardarTicketFirmaMediaOutput>;

  eliminarFirma(input: EliminarTicketFirmaMediaInput): Promise<void>;
}
