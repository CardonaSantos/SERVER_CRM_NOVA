import { Global, Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { AuditoriaAuthService } from './auditoria-auth.service';
import { SesionesService } from './sesiones.service';

/*
 * Global: JwtAuthGuard (usado con @UseGuards en decenas de módulos) y el
 * gateway WS necesitan SesionesService para validar la sesión de cada
 * petición. JwtService llega del JwtModule global de AuthModule.
 */
@Global()
@Module({
  imports: [PrismaModule],
  providers: [SesionesService, AuditoriaAuthService],
  exports: [SesionesService, AuditoriaAuthService],
})
export class SesionesModule {}
