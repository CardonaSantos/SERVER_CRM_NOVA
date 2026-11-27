export const TIEMPO_REAL = Symbol('TIEMPO_REAL');

/**
 * A quién llega un evento. Se suman: quien esté en más de un destino lo
 * recibe una sola vez. Sin ningún destino no se emite.
 */
export type DestinoTiempoReal = {
  usuarioIds?: readonly number[];
  roles?: readonly string[];
  /** Toda sesión conectada. */
  todos?: boolean;
};

/**
 * Avisos en vivo a las pantallas conectadas. Cada módulo es dueño del nombre
 * (`<contexto>:<hecho>`) y de los datos de sus eventos, y los arma con lista
 * blanca: nada de registros completos ni datos personales que la pantalla no
 * use.
 */
export interface TiempoRealPort {
  /**
   * Emite a los sockets conectados del destino. Nunca lanza: el aviso es
   * secundario y la operación que lo pidió ya está guardada.
   */
  emitir(evento: string, datos: object, destino: DestinoTiempoReal): void;
}
