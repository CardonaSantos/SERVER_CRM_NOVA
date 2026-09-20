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
import { PppoeCuentaAccionesController } from './presentation/pppoe-cuenta-acciones.controller';
import { CrearPrealtaPppoeClienteUseCase } from './application/use-cases/crear-prealta-pppoe-cliente.use-case';
import { ProvisionarPppoeClienteManualUseCase } from './application/use-cases/provisionar-pppoe-cliente-manual.use-case';
import { PppoeCuentaProvisionamientoAdminService } from './application/services/pppoe-cuenta-provisionamiento-admin.service';
import { PppoeCuentaProvisionamientoController } from './presentation/pppoe-cuenta-provisionamiento.controller';

import { PrismaModule } from 'src/prisma/prisma.module';

import { VerificarAdopcionPppoeUseCase } from './application/use-cases/verificar-adopcion-pppoe.use-case';

import { PPPOE_ADOPCION_PERSISTENCE_PORT } from './domain/ports/pppoe-adopcion-persistence.port';

import { PppoeAdopcionPrismaPersistence } from './infra/prisma/pppoe-adopcion-prisma.persistence';
import { AdoptarCuentaPppoeExistenteUseCase } from './application/use-cases/adoptar-cuenta-pppoe-existente.use-case';
import { PppoeCuentaAdopcionController } from './presentation/pppoe-cuenta-adopcion.controller';
import { CLIENTE_INTERNET_ESTADO_OPERATIVO } from './domain/ports/cliente-internet-estado-operativo.port';
import { ClienteInternetEstadoOperativoPrismaAdapter } from './infra/prisma/cliente-internet-estado-operativo-prisma.adapter';

@Module({
  controllers: [
    PppoeCuentaAdopcionController,
    PppoeOperacionAdminController,
    PppoeCuentaAccionesController,
    PppoeCuentaProvisionamientoController,
  ],
  imports: [
    PrismaModule,
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
    AdoptarCuentaPppoeExistenteUseCase,
    /*
     * Prealta y consultas
     */
    PrepararPrealtaPppoeUseCase,
    ConsultarCredencialesPppoeInstalacionUseCase,

    /*
     * Adopción de cuentas existentes
     */
    VerificarAdopcionPppoeUseCase,
    PppoeAdopcionPrismaPersistence,

    /*
     * Servicios internos
     */
    PppoeOperacionAdminService,
    ResolverContextoEjecucionPppoeService,
    PppoeOperacionStepRunnerService,
    PppoeOperacionAuditoriaService,
    PppoeProvisionamientoService,
    PppoeCuentaProvisionamientoAdminService,

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
    ProvisionarPppoeClienteManualUseCase,

    /*
     * Tokens / fachadas
     */
    CrearPrealtaPppoeClienteUseCase,

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

    {
      provide: PPPOE_ADOPCION_PERSISTENCE_PORT,

      useExisting: PppoeAdopcionPrismaPersistence,
    },
    {
      provide: CLIENTE_INTERNET_ESTADO_OPERATIVO,

      useClass: ClienteInternetEstadoOperativoPrismaAdapter,
    },
  ],

  exports: [
    PPPOE_PREALTA,
    PPPOE_CREDENCIALES_INSTALACION,
    PPPOE_PROVISIONAMIENTO,
  ],
})
export class PppoeAutomatizacionModule {}
