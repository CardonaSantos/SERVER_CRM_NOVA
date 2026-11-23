import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

/**
 * Compara un secreto recibido contra el esperado en tiempo constante.
 * Falla cerrado: si el esperado no está configurado (o es vacío), NUNCA
 * acepta — antes `undefined !== undefined` dejaba pasar sin secreto.
 * Se comparan los SHA-256 para no filtrar la longitud del secreto.
 */
export function secretoCoincide(
  recibido: unknown,
  esperado: string | undefined | null,
): boolean {
  if (typeof esperado !== 'string' || esperado.length === 0) return false;
  if (typeof recibido !== 'string' || recibido.length === 0) return false;

  const a = createHash('sha256').update(recibido).digest();
  const b = createHash('sha256').update(esperado).digest();

  return timingSafeEqual(a, b);
}

/**
 * Verifica la cabecera X-Hub-Signature-256 de Meta ("sha256=<hex>"):
 * HMAC-SHA256 del body CRUDO con el App Secret. Falla cerrado si falta el
 * secreto, el body crudo o la cabecera.
 */
export function firmaMetaValida(
  bodyCrudo: Buffer | undefined,
  cabecera: unknown,
  appSecret: string | undefined | null,
): boolean {
  if (typeof appSecret !== 'string' || appSecret.length === 0) return false;
  if (!Buffer.isBuffer(bodyCrudo)) return false;
  if (typeof cabecera !== 'string' || !cabecera.startsWith('sha256=')) {
    return false;
  }

  const recibida = Buffer.from(cabecera.slice('sha256='.length), 'hex');
  const esperada = createHmac('sha256', appSecret).update(bodyCrudo).digest();

  return (
    recibida.length === esperada.length && timingSafeEqual(recibida, esperada)
  );
}
