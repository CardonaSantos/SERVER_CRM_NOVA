export const TICKET_CONFORMIDAD_TOKEN_PORT = Symbol(
  'TICKET_CONFORMIDAD_TOKEN_PORT',
);

export interface TicketConformidadGeneratedToken {
  /**
   * Token plano.
   *
   * Se devuelve una única vez al caso de uso para construir
   * posteriormente la URL pública.
   *
   * Nunca se persiste.
   */
  token: string;

  /**
   * SHA-256 hexadecimal del token.
   *
   * Este es el único valor que se persiste.
   */
  tokenHash: string;
}

export interface TicketConformidadTokenPort {
  generate(): TicketConformidadGeneratedToken;

  hash(token: string): string;
}
