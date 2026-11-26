import { Module } from '@nestjs/common';

import { PppoeCredentialsModule } from '../pppoe-credentials/pppoe-credentials.module';

import { PppoeAuditoriaModule } from '../pppoe-auditoria/pppoe-auditoria.module';

import { PrepararPrealtaPppoeUseCase } from './application/use-cases/preparar-prealta-pppoe.use-case';

import { ResolverContextoEjecucionPppoeService } from './application/services/resolver-contexto-ejecucion-pppoe.service';
import { SincronizacionLocalPppoeService } from './application/services/sincronizacion-local-pppoe.service';

import { PPPOE_PREALTA } from './public/pppoe-prealta.port';

import { PppoePerfilHomologacionModule } from '../pppoe-perfil-homologacion/pppoe-perfil-homologacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { MikroTikModule } from 'src/mikro-tik/mikro-tik.module';
import { CrearYEjecutarActivacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-activacion-pppoe.use-case';
import { PppoeOperacionModule } from '../pppoe-operacion/pppoe-operacion.module';
import { EjecutorActivarSecretPppoeService } from './application/services/ejecutor-activar-secret-pppoe.service';
import { PppoeOperacionStepRunnerService } from './application/services/pppoe-operacion-step-runner.service';
import { MikrotikSshModule } from '../mikrotik-ssh/mikrotik-ssh.module';
import { EjecutarPppoeOperacionUseCase } from './application/use-cases/ejecutar-pppoe-operacion.use-case';
import { EjecutorCrearSecretPppoeService } from './application/services/ejecutor-crear-secret-pppoe.service';
import { CrearYEjecutarOperacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-operacion-pppoe.use-case';
import { EjecutorSuspenderServicioPppoeService } from './application/services/ejecutor-suspender-servicio-pppoe.service';
import { CrearYEjecutarSuspensionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-suspension-pppoe.use-case';
import { PppoeProvisionamientoService } from './application/services/pppoe-provisionamiento.service';
import { PPPOE_PROVISIONAMIENTO } from './public/pppoe-provisionamiento.port';
import { RecuperarPppoeOperacionInterrumpidaUseCase } from './application/use-cases/recuperar-pppoe-operacion-interrumpida.use-case';

import { PPPOE_OPERACION_AUDITORIA } from './application/ports/pppoe-operacion-auditoria.port';

import { PppoeOperacionAuditoriaService } from './application/services/pppoe-operacion-auditoria.service';
import { EjecutorEliminarSecretPppoeService } from './application/services/ejecutor-eliminar-secret-pppoe.service';
import { CrearYEjecutarEliminacionPppoeUseCase } from './application/use-cases/crear-y-ejecutar-eliminacion-pppoe.use-case';
import { PppoeOperacionAdminService } from './application/services/pppoe-operacion-admin.service';
import { PppoeOperacionAdminController } from './presentation/http/pppoe-operacion-admin.controller';
import { AuthModule } from 'src/auth/auth.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { PppoeCuentaAccionesController } from './presentation/http/pppoe-cuenta-acciones.controller';
import { CrearPrealtaPppoeClienteUseCase } from './application/use-cases/crear-prealta-pppoe-cliente.use-case';
import { ProvisionarPppoeClienteManualUseCase } from './application/use-cases/provisionar-pppoe-cliente-manual.use-case';
import { PppoeCuentaProvisionamientoAdminService } from './application/services/pppoe-cuenta-provisionamiento-admin.service';
import { PppoeCuentaProvisionamientoController } from './presentation/http/pppoe-cuenta-provisionamiento.controller';

import { PrismaModule } from 'src/prisma/prisma.module';

import { VerificarAdopcionPppoeUseCase } from './application/use-cases/verificar-adopcion-pppoe.use-case';

import { AdoptarCuentaPppoeExistenteUseCase } from './application/use-cases/adoptar-cuenta-pppoe-existente.use-case';
import { PppoeCuentaAdopcionController } from './presentation/http/pppoe-cuenta-adopcion.controller';
import { CLIENTE_INTERNET_ESTADO_OPERATIVO } from './application/ports/cliente-internet-estado-operativo.port';
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
    PppoeAccesoInternetModule,
    MikroTikModule,
  ],
  providers: [
    AdoptarCuentaPppoeExistenteUseCase,
    /*
     * Prealta y consultas
     */
    PrepararPrealtaPppoeUseCase,
    /*
     * Adopción de cuentas existentes
     */
    VerificarAdopcionPppoeUseCase,
    /*
     * Servicios internos
     */
    PppoeOperacionAdminService,
    ResolverContextoEjecucionPppoeService,
    SincronizacionLocalPppoeService,
    PppoeOperacionStepRunnerService,
    PppoeOperacionAuditoriaService,
    PppoeProvisionamientoService,
    PppoeCuentaProvisionamientoAdminService,
    /*
     * Ejecutores SSH
     */
    EjecutorCrearSecretPppoeService,
    EjecutorActivarSecretPppoeService,
    EjecutorSuspenderServicioPppoeService,
    EjecutorEliminarSecretPppoeService,
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
      provide: PPPOE_PROVISIONAMIENTO,
      useExisting: PppoeProvisionamientoService,
    },
    {
      provide: PPPOE_OPERACION_AUDITORIA,
      useExisting: PppoeOperacionAuditoriaService,
    },
    {
      provide: CLIENTE_INTERNET_ESTADO_OPERATIVO,
      useClass: ClienteInternetEstadoOperativoPrismaAdapter,
    },
  ],
  exports: [PPPOE_PREALTA, PPPOE_PROVISIONAMIENTO],
})
export class PppoeAutomatizacionModule {}
