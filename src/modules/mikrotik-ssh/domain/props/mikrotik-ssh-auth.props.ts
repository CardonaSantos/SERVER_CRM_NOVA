import { MetodoAutenticacionMikrotikSsh } from '../enums/mikrotik-ssh.enums';

/**
 * Autenticación mediante contraseña.
 *
 * La contraseña debe llegar descifrada y permanecer
 * únicamente en memoria durante la sesión.
 */
export type AutenticacionPasswordMikrotikSsh = {
  metodo: MetodoAutenticacionMikrotikSsh.PASSWORD;

  password: string;
};

/**
 * Autenticación mediante clave privada.
 *
 * privateKey contiene la clave ya descifrada.
 */
export type AutenticacionPrivateKeyMikrotikSsh = {
  metodo: MetodoAutenticacionMikrotikSsh.PRIVATE_KEY;

  privateKey: string;

  passphrase?: string | null;
};

/**
 * Métodos de autenticación admitidos por el módulo.
 */
export type AutenticacionMikrotikSsh =
  | AutenticacionPasswordMikrotikSsh
  | AutenticacionPrivateKeyMikrotikSsh;

/**
 * Verificación estricta mediante huella SHA-256.
 */
export type VerificacionHostMikrotikSsh =
  | {
      verificar: true;

      huellaSha256: string;
    }
  | {
      /**
       * Solo debe utilizarse en entornos controlados.
       */
      verificar: false;

      huellaSha256?: never;
    };
