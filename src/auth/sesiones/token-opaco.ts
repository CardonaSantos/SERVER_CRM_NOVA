import { createHash, randomBytes } from 'node:crypto';

/**
 * Refresh token opaco de 256 bits (D4). No es un JWT: se valida contra la
 * BD igual, firmarlo no agrega nada.
 */
export function generarTokenOpaco(): string {
  return randomBytes(32).toString('base64url');
}

/**
 * Hash SHA-256 para guardar en BD. Suficiente para un secreto aleatorio de
 * 256 bits; bcrypt/scrypt existen para contraseñas humanas (D4).
 */
export function hashSha256(valor: string): string {
  return createHash('sha256').update(valor).digest('hex');
}
