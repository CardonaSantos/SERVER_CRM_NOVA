export const PPPOE_SECRET_CIPHER = Symbol('PPPOE_SECRET_CIPHER');

/** Material cifrado de una contraseña PPPoE, tal como se guarda en la BD. */
export type SecretoPppoeProtegido = {
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;
};

/**
 * Cifrado de las contraseñas PPPoE de los clientes.
 *
 * La contraseña plana solo existe en memoria durante el cifrado, al
 * revelarla al operador o al enviar el comando SSH. Nunca se registra.
 */
export interface PppoeSecretCipherPort {
  /**
   * Protege una contraseña en texto plano.
   */
  encrypt(secretoPlano: string): Promise<SecretoPppoeProtegido>;

  /**
   * Recupera temporalmente la contraseña.
   *
   * Se utilizará antes de enviar el comando SSH.
   */
  decrypt(secreto: SecretoPppoeProtegido): Promise<string>;
}
