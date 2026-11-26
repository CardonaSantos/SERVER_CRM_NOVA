import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';

import { CrearClienteInstalacionUseCase } from './application/use-cases/crear-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from './application/use-cases/listar-cliente-instalaciones.use-case';
import { ObtenerClienteInstalacionUseCase } from './application/use-cases/obtener-cliente-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from './application/use-cases/actualizar-cliente-instalacion.use-case';
import { ReprogramarInstalacionClienteUseCase } from './application/use-cases/reprogramar-cliente-instalacion.use-case';
import { IniciarClienteInstalacionUseCase } from './application/use-cases/iniciar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionUseCase } from './application/use-cases/completar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionUseCase } from './application/use-cases/cancelar-cliente-instalacion.use-case';
import { SubirEvidenciaInstalacionUseCase } from './application/use-cases/subir-evidencia-instalacion.use-case';
import { ClienteInstalacionController } from './presentation/http/cliente-instalacion.controller';
import { CLIENTE_INSTALACION_MEDIA_REPOSITORY } from './domain/ports/cliente-instalacion-media-repository.port';
import { CLIENTE_INSTALACION_REPOSITORY } from './domain/ports/cliente-instalacion-repository.port';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from './domain/ports/cliente-instalacion-acceso-repository.port';
import { ClienteInstalacionApplicationService } from './application/services/cliente-instalacion.aplication-service.service';
import { ClienteInstalacionPrismaRepository } from './infra/prisma/cliente-instalacion-prisma.repository';
import { ClienteInstalacionMediaPrismaRepository } from './infra/prisma/cliente-instalacion-media-prisma.repository';
import { ClienteInstalacionAccesoPrismaRepository } from './infra/prisma/cliente-instalacion-acceso-prisma.repository';
import { PppoeAutomatizacionModule } from '../pppoe-automatizacion/pppoe-automatizacion.module';
import { ReintentarPrealtaPppoeInstalacionUseCase } from './application/use-cases/reintentar-prealta-pppoe-instalacion.use-case';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { ResolverPppoeInstalacionService } from './application/services/resolver-pppoe-instalacion.service';
import { AuthModule } from 'src/auth/auth.module';
import { ListarMisInstalacionesAsignadasUseCase } from './application/use-cases/listar-mis-instalaciones-asignadas.use-case';
import { ObtenerDetalleTecnicoInstalacionUseCase } from './application/use-cases/obtener-detalle-tecnico-instalacion.use-case';
import { ActivarPppoeInstalacionUseCase } from './application/use-cases/activar-pppoe-instalacion.use-case';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AlmacenamientoMediaModule,
    PppoeAccesoInternetModule,
    PppoeAutomatizacionModule,
    PppoeClienteCuentaModule,
  ],

  controllers: [ClienteInstalacionController],

  providers: [
    ActivarPppoeInstalacionUseCase,
    ObtenerDetalleTecnicoInstalacionUseCase,
    ListarMisInstalacionesAsignadasUseCase,
    ClienteInstalacionApplicationService,
    ResolverPppoeInstalacionService,
    CrearClienteInstalacionUseCase,
    ListarClienteInstalacionesUseCase,
    ObtenerClienteInstalacionUseCase,
    ActualizarClienteInstalacionUseCase,
    ReprogramarInstalacionClienteUseCase,
    IniciarClienteInstalacionUseCase,
    CompletarClienteInstalacionUseCase,
    CancelarClienteInstalacionUseCase,
    SubirEvidenciaInstalacionUseCase,
    ReintentarPrealtaPppoeInstalacionUseCase,
    {
      provide: CLIENTE_INSTALACION_REPOSITORY,
      useClass: ClienteInstalacionPrismaRepository,
    },
    {
      provide: CLIENTE_INSTALACION_MEDIA_REPOSITORY,
      useClass: ClienteInstalacionMediaPrismaRepository,
    },
    {
      provide: CLIENTE_INSTALACION_ACCESO_REPOSITORY,
      useClass: ClienteInstalacionAccesoPrismaRepository,
    },
  ],

  exports: [ClienteInstalacionApplicationService],
})
export class ClienteInstalacionModule {}
