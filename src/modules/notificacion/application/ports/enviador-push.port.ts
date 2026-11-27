export const ENVIADOR_PUSH = Symbol('ENVIADOR_PUSH');

export type MensajePush = {
  tokens: readonly string[];
  titulo: string;
  cuerpo: string;
  datos: Record<string, string>;
  canal: string;
  claveAgrupacion?: string;
  vigenciaMs: number;
  sonido: boolean;
};

export type ResultadoEnvioPush = {
  exitosos: number;
  fallidos: number;
  /** Tokens que el proveedor dio por muertos: se desactivan. */
  tokensInvalidos: string[];
};

export interface EnviadorPushPort {
  /** `false` si faltan las credenciales del proveedor: no se envía nada. */
  disponible(): boolean;

  /** Nunca lanza: un lote caído cuenta como fallido. Nunca registra tokens. */
  enviar(mensaje: MensajePush): Promise<ResultadoEnvioPush>;
}
