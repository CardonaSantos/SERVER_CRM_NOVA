import { Global, Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';
import { TareasProgramadasModule } from 'src/modules/tareas-programadas/tareas-programadas.module';

import { AuditoriaAuthService } from './auditoria-auth.service';
import { LimpiezaSesionesCron } from './limpieza-sesiones.cron';
import { LimpiezaSesionesService } from './limpieza-sesiones.service';
import { SesionesService } from './sesiones.service';

/*
 * Global: JwtAuthGuard (usado con @UseGuards en decenas de módulos) y el
 * gateway WS necesitan SesionesService para validar la sesión de cada
 * petición. JwtService llega del JwtModule global de AuthModule.
 */
@Global()
@Module({
  imports: [PrismaModule, TareasProgramadasModule],
  providers: [
    SesionesService,
    AuditoriaAuthService,
    LimpiezaSesionesService,
    LimpiezaSesionesCron,
  ],
  exports: [SesionesService, AuditoriaAuthService],
})
export class SesionesModule {}
