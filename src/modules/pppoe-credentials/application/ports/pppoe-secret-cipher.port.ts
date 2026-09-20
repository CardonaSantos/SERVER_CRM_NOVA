export type SecretoPppoeProtegido = {
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;
};

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
