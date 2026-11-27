export const HASH_CONTRASENA = Symbol('HASH_CONTRASENA');

/** Codifica y verifica contraseñas (scrypt; acepta bcrypt heredado). */
export interface HashContrasenaPort {
  hash(contrasena: string): Promise<string>;

  /** Nunca lanza: un hash desconocido es contraseña incorrecta. */
  verify(contrasena: string, hash: string): Promise<boolean>;
}
