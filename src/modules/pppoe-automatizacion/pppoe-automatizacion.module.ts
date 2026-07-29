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
import { CrearYEjecutarActivacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-activacion-pppoe.use-case';
import { PppoeOperacionModule } from '../pppoe-operacion/pppoe-operacion.module';
import { ActivarSecretPppoeExecutor } from './application/executors/activar-secret-pppoe.executor';
import { PppoeOperacionStepRunnerService } from './application/services/pppoe-operacion-step-runner.service';
import { MikrotikSshModule } from '../mikrotik-ssh/mikrotik-ssh.module';
import { EjecutarPppoeOperacionUseCase } from './application/use-cases/ejecutar-pppoe-operacion.use-case';
import { CrearSecretPppoeExecutor } from './application/executors/crear-secret-pppoe.executor';
import { CrearYEjecutarOperacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-operacion-pppoe.use-case';
import { SuspenderServicioPppoeExecutor } from './application/executors/suspender-servicio-pppoe.executor';
import { CrearYEjecutarSuspensionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-suspension-pppoe.use-case';
import { PppoeProvisionamientoService } from './application/services/pppoe-provisionamiento.service';
import { PPPOE_PROVISIONAMIENTO } from './domain/ports/pppoe-provisionamiento.port';
import { RecuperarPppoeOperacionInterrumpidaUseCase } from './application/use-cases/recuperar-pppoe-operacion-interrumpida.use-case';

import { PPPOE_OPERACION_AUDITORIA } from './domain/ports/pppoe-operacion-auditoria.port';

import { PppoeOperacionAuditoriaService } from './application/services/pppoe-operacion-auditoria.service';
import { EliminarSecretPppoeExecutor } from './application/executors/eliminar-secret-pppoe.executor';
import { CrearYEjecutarEliminacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-eliminacion-pppoe.use-case';
import { PppoeOperacionAdminService } from './application/services/pppoe-operacion-admin.service';
import { PppoeOperacionAdminController } from './presentation/pppoe-operacion-admin.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PpoeAccesoInternetModule } from '../pppoe-acceso-internet/ppoe-acceso-internet.module';

@Module({
  controllers: [PppoeOperacionAdminController],
  imports: [
    AuthModule,
    PppoePerfilHomologacionModule,
    PppoeOperacionModule,
    PppoeClienteCuentaModule,
    MikrotikSshModule,
    PppoeCredentialsModule,

    PppoeAuditoriaModule,
    PpoeAccesoInternetModule,
    MikroTikModule,
  ],

  providers: [
    /*
     * Prealta y consultas
     */
    PrepararPrealtaPppoeUseCase,
    ConsultarCredencialesPppoeInstalacionUseCase,

    /*
     * Servicios internos
     */
    PppoeOperacionAdminService,
    ResolverContextoEjecucionPppoeService,
    PppoeOperacionStepRunnerService,
    PppoeOperacionAuditoriaService,

    /*
     * Ejecutores SSH
     */
    CrearSecretPppoeExecutor,
    ActivarSecretPppoeExecutor,
    SuspenderServicioPppoeExecutor,
    EliminarSecretPppoeExecutor,
    /*
     * Orquestación
     */
    EjecutarPppoeOperacionUseCase,
    CrearYEjecutarOperacionPppoeUseCase,
    CrearYEjecutarActivacionPppoeUseCase,
    CrearYEjecutarSuspensionPppoeUseCase,
    RecuperarPppoeOperacionInterrumpidaUseCase,
    CrearYEjecutarEliminacionPppoeUseCase,

    /*
     * Fachada pública
     */
    PppoeProvisionamientoService,

    /*
     * Tokens
     */
    {
      provide: PPPOE_PREALTA,
      useExisting: PrepararPrealtaPppoeUseCase,
    },
    {
      provide: PPPOE_CREDENCIALES_INSTALACION,
      useExisting: ConsultarCredencialesPppoeInstalacionUseCase,
    },
    {
      provide: PPPOE_PROVISIONAMIENTO,
      useExisting: PppoeProvisionamientoService,
    },
    {
      provide: PPPOE_OPERACION_AUDITORIA,
      useExisting: PppoeOperacionAuditoriaService,
    },
  ],

  exports: [
    PPPOE_PREALTA,
    PPPOE_CREDENCIALES_INSTALACION,
    PPPOE_PROVISIONAMIENTO,
  ],
})
export class PppoeAutomatizacionModule {}
