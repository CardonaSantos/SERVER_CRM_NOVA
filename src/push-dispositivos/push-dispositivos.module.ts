import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { PushDispositivosService } from './app/push-dispositivos.service';
import { PushDispositivosController } from './presentation/push-dispositivos.controller';

@Module({
  imports: [PrismaModule],

  controllers: [PushDispositivosController],

  providers: [PushDispositivosService],

  /*
   * Lo exportamos porque el siguiente servicio:
   *
   * FirebasePushService
   *
   * necesitará:
   *
   * obtenerTokensActivosPorUsuario()
   * desactivarTokensInvalidos()
   * obtenerPreferenciasUsuario()
   */
  exports: [PushDispositivosService],
})
export class PushDispositivosModule {}
