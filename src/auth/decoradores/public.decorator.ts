import { SetMetadata } from '@nestjs/common';

export const ES_PUBLICO = 'auth:esPublico';

/**
 * Excluye la ruta (o el controlador completo) del guard global de JWT
 * (D6). Solo para endpoints que de verdad deben ser públicos: login,
 * refresh, webhooks con su propia firma, enlaces con token propio.
 */
export const Public = () => SetMetadata(ES_PUBLICO, true);
