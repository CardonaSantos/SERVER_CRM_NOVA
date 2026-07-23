import { SecretoPppoeProtegidoProps } from '../entities/ppoe-cliente-cuenta.entity';

export type SecretoPppoeCifradoResult = {
  secretoCifrado: string;
  secretoIv: string;
  secretoAuthTag: string;
  versionClave: number;
};

export interface PppoeSecretCipherPort {
  /**
   * Cifra una contraseña en texto plano.
   *
   * El texto plano no se almacena.
   */
  encrypt(secretoPlano: string): Promise<SecretoPppoeCifradoResult>;

  /**
   * Recupera temporalmente la contraseña para
   * ejecutar una operación autorizada contra MikroTik.
   */
  decrypt(secreto: SecretoPppoeProtegidoProps): Promise<string>;
}
