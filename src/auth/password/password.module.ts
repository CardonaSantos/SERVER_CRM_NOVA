import { Global, Module } from '@nestjs/common';

import { PasswordService } from './password.service';

/*
 * Global: lo usan UsuarioModule (crear, cambiar y verificar contraseñas),
 * AuthModule (login) y la reautenticación PPPoE. UsuarioModule no puede
 * importar AuthModule (AuthModule ya importa UsuarioModule).
 */
@Global()
@Module({
  providers: [PasswordService],
  exports: [PasswordService],
})
export class PasswordModule {}
