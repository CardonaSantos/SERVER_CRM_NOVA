import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';

import { DigitalOceanMediaModule } from '../digital-ocean-media/digital-ocean-media.module';
import { PpoeAccesoInternetModule } from '../pppoe-acceso-internet/ppoe-acceso-internet.module';

import { CrearClienteInstalacionUseCase } from './application/use-cases/crear-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from './application/use-cases/listar-cliente-instalaciones.use-case';
import { ObtenerClienteInstalacionUseCase } from './application/use-cases/obtener-cliente-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from './application/use-cases/actualizar-cliente-instalacion.use-case';
import { ReprogramarInstalacionClienteUseCase } from './application/use-cases/reprogramar-cliente-instalacion.use-case';
import { IniciarClienteInstalacionUseCase } from './application/use-cases/iniciar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionUseCase } from './application/use-cases/completar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionUseCase } from './application/use-cases/cancelar-cliente-instalacion.use-case';
import { SubirEvidenciaInstalacionUseCase } from './application/use-cases/subir-evidencia-instalacion.use-case';
import { DeleteAllClienteInstalacionUseCase } from './application/use-cases/delete-all';
import { ClienteInstalacionController } from './presentation/cliente-instalacion.controller';
import {
  CLIENTE_INSTALACION_MEDIA_REPOSITORY,
  CLIENTE_INSTALACION_REPOSITORY,
} from './infra/tokens/cliente-instalacion.tokens';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from '../ppoe-instalacion-acceso/tokens/instalacion-acceso.token';
import { ClienteInstalacionApplicationService } from './application/services/cliente-instalacion.aplication-service.service';
import { ClienteInstalacionPrismaRepository } from './infra/prisma/cliente-instalacion.prisma.repository';
import { ClienteInstalacionMediaPrismaRepository } from './infra/prisma/cliente-instalacion-media.prisma.repository';
import { ClienteInstalacionAccesoPrismaRepository } from '../ppoe-instalacion-acceso/infra/prisma/cliente-instalacion-acceso.repository.prisma';
import { PppoeAutomatizacionModule } from '../pppoe-automatizacion/pppoe-automatizacion.module';
import { ReintentarPrealtaPppoeInstalacionUseCase } from './application/use-cases/reintentar-prealta-pppoe-instalacion.use-case';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/ppoe-cliente-cuenta.module';
import { ResolverPppoeInstalacionService } from './application/services/resolver-pppoe-instalacion.service';
import { AuthModule } from 'src/auth/auth.module';
import { ListarMisInstalacionesAsignadasUseCase } from './application/use-cases/listar-mis-instalaciones-asignadas.use-case';
import { ObtenerDetalleTecnicoInstalacionUseCase } from './application/use-cases/obtener-detalle-tecnico-instalacion.use-case';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    DigitalOceanMediaModule,
    PpoeAccesoInternetModule,
    PppoeAutomatizacionModule,
    PppoeClienteCuentaModule,
  ],

  controllers: [ClienteInstalacionController],

  providers: [
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
    DeleteAllClienteInstalacionUseCase,
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
