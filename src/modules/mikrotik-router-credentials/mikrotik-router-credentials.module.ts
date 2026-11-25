import { Module } from '@nestjs/common';

import { MikrotikRouterSecretAesGcmAdapter } from './infra/crypto/mikrotik-router-secret-aes-gcm.adapter';
import { MIKROTIK_ROUTER_SECRET_CIPHER } from './public/mikrotik-router-secret-cipher.port';

/**
 * Cifrado de las credenciales administrativas de los routers MikroTik.
 *
 * API pública: `public/mikrotik-router-secret-cipher.port.ts`
 * (token MIKROTIK_ROUTER_SECRET_CIPHER). ConfigService es global.
 */
@Module({
  providers: [
    // Adaptadores
    {
      provide: MIKROTIK_ROUTER_SECRET_CIPHER,
      useClass: MikrotikRouterSecretAesGcmAdapter,
    },
  ],
  exports: [MIKROTIK_ROUTER_SECRET_CIPHER],
})
export class MikrotikRouterCredentialsModule {}
