import { Module } from '@nestjs/common';

import { PppoeCredentialsModule } from '../pppoe-credentials/pppoe-credentials.module';

import { PppoeAuditoriaModule } from '../pppoe-auditoria/pppoe-auditoria.module';

import { PrepararPrealtaPppoeUseCase } from './application/use-cases/preparar-prealta-pppoe.use-case';

import { ResolverContextoEjecucionPppoeService } from './application/services/resolver-contexto-ejecucion-pppoe.service';

import { PPPOE_PREALTA } from './domain/ports/pppoe-prealta.port';

import { PPPOE_CREDENCIALES_INSTALACION } from './domain/ports/pppoe-credenciales-instalacion.port';
import { PppoePerfilHomologacionModule } from '../pppoe-perfil-homologacion/ppoe-perfil-homologacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/ppoe-cliente-cuenta.module';
import { MikroTikModule } from 'src/mikro-tik/mikro-tik.module';
import { ConsultarCredencialesPppoeInstalacionUseCase } from '../pppoe-cliente-cuenta/application/use-cases/consultar-credenciales-pppoe-instalacion.use-case';

import { PppoeOperacionModule } from '../pppoe-operacion/pppoe-operacion.module';

import { PppoeOperacionStepRunnerService } from './application/services/pppoe-operacion-step-runner.service';
import { MikrotikSshModule } from '../mikrotik-ssh/mikrotik-ssh.module';

import { CrearSecretPppoeExecutor } from './application/executors/crear-secret-pppoe.executor';

@Module({
  imports: [
    PppoePerfilHomologacionModule,
    PppoeOperacionModule,
    PppoeClienteCuentaModule,
    MikrotikSshModule,
    PppoeCredentialsModule,

    PppoeAuditoriaModule,

    MikroTikModule,
  ],

  providers: [
    PrepararPrealtaPppoeUseCase,
    PppoeOperacionStepRunnerService,
    CrearSecretPppoeExecutor,
    ConsultarCredencialesPppoeInstalacionUseCase,

    ResolverContextoEjecucionPppoeService,

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
