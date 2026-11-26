import {
  EliminarTicketFirmaMediaInput,
  GuardarTicketFirmaMediaInput,
  TicketFirmaMediaPort,
} from '../../application/ports/ticket-firma-media.port';

export class TicketFirmaMediaFake implements TicketFirmaMediaPort {
  readonly guardadas: GuardarTicketFirmaMediaInput[] = [];
  readonly eliminadas: EliminarTicketFirmaMediaInput[] = [];

  /** Si se asigna, `guardarFirma` falla con este error. */
  fallaAlGuardar: Error | null = null;

  /** Si es `true`, `eliminarFirma` falla (la compensación no se pudo hacer). */
  fallaAlEliminar = false;

  private siguienteId = 900;

  guardarFirma(input: GuardarTicketFirmaMediaInput): Promise<number> {
    if (this.fallaAlGuardar) return Promise.reject(this.fallaAlGuardar);

    this.guardadas.push(input);

    return Promise.resolve(this.siguienteId++);
  }

  eliminarFirma(input: EliminarTicketFirmaMediaInput): Promise<void> {
    if (this.fallaAlEliminar) return Promise.reject(new Error('Spaces caído'));

    this.eliminadas.push(input);

    return Promise.resolve();
  }
}
