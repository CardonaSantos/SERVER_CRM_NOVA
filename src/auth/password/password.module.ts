import { Global, Module } from '@nestjs/common';

import { PasswordService } from './password.service';

/*
 * Global: lo usan UserModule (crear/actualizar/validar), AuthModule (login),
 * la reautenticación PPPoE y ssh-mikrotik. UserModule no puede importar
 * AuthModule (AuthModule ya importa UserModule).
 */
@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
