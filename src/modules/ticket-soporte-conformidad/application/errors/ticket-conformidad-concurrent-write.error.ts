export class TicketConformidadConcurrentWriteError extends Error {
  constructor(
    message = 'La conformidad o el enlace fueron modificados por otra operación.',
  ) {
    super(message);

    this.name = TicketConformidadConcurrentWriteError.name;
  }
}
