export const TICKET_CONFORMIDAD_LINK_CONFIG_PORT = Symbol(
  'TICKET_CONFORMIDAD_LINK_CONFIG_PORT',
);

export interface TicketConformidadLinkConfigPort {
  getTtlMinutes(): number;
}
