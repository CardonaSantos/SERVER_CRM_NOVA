import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MIKROTIK_ROUTER_SECRET_CIPHER } from './application/ports/mikrotik-router-secret-cipher.port';
import { AesGcmMikrotikRouterSecretCipher } from './infra/crypto/aes-gcm-mikrotik-router-secret-cipher';

@Module({
  imports: [ConfigModule],

  providers: [
    AesGcmMikrotikRouterSecretCipher,

    {
      provide: MIKROTIK_ROUTER_SECRET_CIPHER,

      useExisting: AesGcmMikrotikRouterSecretCipher,
    },
  ],

  exports: [MIKROTIK_ROUTER_SECRET_CIPHER],
})
export class MikrotikRouterCredentialsModule {}
