export const MENSAJERIA_CLIENTE_EVENTOS = Symbol('MENSAJERIA_CLIENTE_EVENTOS');

export type AvisoMensajeBot = {
  /** Id del mensaje en WhatsApp. */
  wamid: string;
  recibidoEn: Date;
};

export interface MensajeriaClienteEventosPort {
  /**
   * Avisa a las pantallas del chat que el bot registró un mensaje. Nunca hace
   * fallar la operación.
   */
  mensajeBotRecibido(aviso: AvisoMensajeBot): Promise<void>;
}
