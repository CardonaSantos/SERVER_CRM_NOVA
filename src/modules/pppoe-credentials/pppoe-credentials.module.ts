import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PPPOE_SECRET_CIPHER } from './application/ports/pppoe-secret-cipher.port';
import { PPPOE_CREDENTIAL_GENERATOR } from '../pppoe-cliente-cuenta/infra/tokens/pppoe-cliente-cuenta.token';
import { NovaPppoeCredentialGenerator } from './application/ports/nova-pppoe-credential-generator';
import { AesGcmPppoeSecretCipher } from './infra/crypto/aes-gcm-pppoe-secret-cipher';

@Module({
  imports: [ConfigModule],

  providers: [
    {
      provide: PPPOE_CREDENTIAL_GENERATOR,

      useClass: NovaPppoeCredentialGenerator,
    },
    {
      provide: PPPOE_SECRET_CIPHER,

      useClass: AesGcmPppoeSecretCipher,
    },
  ],

  exports: [PPPOE_CREDENTIAL_GENERATOR, PPPOE_SECRET_CIPHER],
})
export class PppoeCredentialsModule {}
