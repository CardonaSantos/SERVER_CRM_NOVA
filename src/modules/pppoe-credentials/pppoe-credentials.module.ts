import { Module } from '@nestjs/common';

import { PppoeSecretAesGcmAdapter } from './infra/crypto/pppoe-secret-aes-gcm.adapter';
import { PppoeCredentialGeneratorNovaAdapter } from './infra/generador/pppoe-credential-generator-nova.adapter';
import { PPPOE_CREDENTIAL_GENERATOR } from './public/pppoe-credential-generator.port';
import { PPPOE_SECRET_CIPHER } from './public/pppoe-secret-cipher.port';

/**
 * Credenciales PPPoE de los clientes: generación y cifrado.
 *
 * API pública (`public/`): PPPOE_CREDENTIAL_GENERATOR y PPPOE_SECRET_CIPHER.
 * ConfigService y RELOJ son globales.
 */
@Module({
  providers: [
    // Adaptadores
    {
      provide: PPPOE_CREDENTIAL_GENERATOR,
      useClass: PppoeCredentialGeneratorNovaAdapter,
    },
    {
      provide: PPPOE_SECRET_CIPHER,
      useClass: PppoeSecretAesGcmAdapter,
    },
  ],
  exports: [PPPOE_CREDENTIAL_GENERATOR, PPPOE_SECRET_CIPHER],
})
export class PppoeCredentialsModule {}
