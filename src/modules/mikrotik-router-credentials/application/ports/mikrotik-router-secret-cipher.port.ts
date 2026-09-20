export const MIKROTIK_ROUTER_SECRET_CIPHER = Symbol(
  'MIKROTIK_ROUTER_SECRET_CIPHER',
);

/**
 * Contrato para proteger las credenciales administrativas
 * utilizadas al conectar con un router MikroTik.
 *
 * La contraseña plana solo debe existir temporalmente
 * durante el cifrado o la apertura de una sesión SSH.
 */
export interface MikrotikRouterSecretCipherPort {
  /**
   * Devuelve el paquete cifrado serializado que se
   * almacenará en MikrotikRouter.passwordEnc.
   */
  encrypt(password: string): Promise<string>;

  /**
   * Recupera temporalmente la contraseña administrativa.
   *
   * El resultado no debe registrarse en logs, auditorías
   * ni respuestas HTTP.
   */
  decrypt(passwordEnc: string): Promise<string>;
}
