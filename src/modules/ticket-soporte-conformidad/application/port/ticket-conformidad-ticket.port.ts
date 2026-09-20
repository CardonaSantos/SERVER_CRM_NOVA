export const TICKET_CONFORMIDAD_TICKET_PORT = Symbol(
  'TICKET_CONFORMIDAD_TICKET_PORT',
);

export interface TicketConformidadTicketContext {
  ticketId: number;

  empresaId: number | null;
  clienteId: number | null;
  tecnicoId: number | null;
}

export interface TicketConformidadTicketPort {
  findContextById(
    ticketId: number,
  ): Promise<TicketConformidadTicketContext | null>;
}
