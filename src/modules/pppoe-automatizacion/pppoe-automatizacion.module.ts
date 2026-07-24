import { Module } from '@nestjs/common';

import { PppoeAuditoriaModule } from '../pppoe-auditoria/pppoe-auditoria.module';

import { PrepararPrealtaPppoeUseCase } from './application/use-cases/preparar-prealta-pppoe.use-case';
import { PppoePerfilHomologacionModule } from '../pppoe-perfil-homologacion/ppoe-perfil-homologacion.module';
import { PPPOE_PREALTA } from './domain/ports/pppoe-prealta.port';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/ppoe-cliente-cuenta.module';
import { PppoeCredentialsModule } from '../pppoe-credentials/pppoe-credentials.module';

@Module({
  imports: [
    PppoePerfilHomologacionModule,
    PppoeClienteCuentaModule,
    PppoeCredentialsModule,
    PppoeAuditoriaModule,
  ],

  providers: [
    PrepararPrealtaPppoeUseCase,

    {
      provide: PPPOE_PREALTA,
      useExisting: PrepararPrealtaPppoeUseCase,
    },
  ],

  exports: [PPPOE_PREALTA],
})
export class PppoeAutomatizacionModule {}
