import { Module } from '@nestjs/common';

import { PppoeAuditoriaModule } from '../pppoe-auditoria/pppoe-auditoria.module';
import { PppoeCredentialsModule } from '../pppoe-credentials/pppoe-credentials.module';

import { PrepararPrealtaPppoeUseCase } from './application/use-cases/preparar-prealta-pppoe.use-case';

import { PPPOE_PREALTA } from './domain/ports/pppoe-prealta.port';

import { PPPOE_CREDENCIALES_INSTALACION } from './domain/ports/pppoe-credenciales-instalacion.port';
import { PppoePerfilHomologacionModule } from '../pppoe-perfil-homologacion/ppoe-perfil-homologacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/ppoe-cliente-cuenta.module';
import { ConsultarCredencialesPppoeInstalacionUseCase } from '../pppoe-cliente-cuenta/application/use-cases/consultar-credenciales-pppoe-instalacion.use-case';

@Module({
  imports: [
    PppoePerfilHomologacionModule,

    PppoeClienteCuentaModule,

    PppoeCredentialsModule,

    PppoeAuditoriaModule,
  ],

  providers: [
    PrepararPrealtaPppoeUseCase,

    ConsultarCredencialesPppoeInstalacionUseCase,

    {
      provide: PPPOE_PREALTA,

      useExisting: PrepararPrealtaPppoeUseCase,
    },

    {
      provide: PPPOE_CREDENCIALES_INSTALACION,

      useExisting: ConsultarCredencialesPppoeInstalacionUseCase,
    },
  ],

  exports: [PPPOE_PREALTA, PPPOE_CREDENCIALES_INSTALACION],
})
export class PppoeAutomatizacionModule {}
