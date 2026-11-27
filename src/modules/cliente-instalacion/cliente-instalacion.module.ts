import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { PppoeAutomatizacionModule } from '../pppoe-automatizacion/pppoe-automatizacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { ServicioModule } from '../servicio/servicio.module';
import { REAUTENTICACION_OPERADOR } from './application/ports/reautenticacion-operador.port';
import { ProvisionarAccesoInstalacionService } from './application/services/provisionar-acceso-instalacion.service';
import { ResolverPppoeInstalacionService } from './application/services/resolver-pppoe-instalacion.service';
import { ActivarPppoeInstalacionUseCase } from './application/use-cases/activar-pppoe-instalacion.use-case';
import { ActualizarClienteInstalacionUseCase } from './application/use-cases/actualizar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionUseCase } from './application/use-cases/cancelar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionUseCase } from './application/use-cases/completar-cliente-instalacion.use-case';
import { CrearClienteInstalacionUseCase } from './application/use-cases/crear-cliente-instalacion.use-case';
import { IniciarClienteInstalacionUseCase } from './application/use-cases/iniciar-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from './application/use-cases/listar-cliente-instalaciones.use-case';
import { ListarMisInstalacionesAsignadasUseCase } from './application/use-cases/listar-mis-instalaciones-asignadas.use-case';
import { ObtenerClienteInstalacionUseCase } from './application/use-cases/obtener-cliente-instalacion.use-case';
import { ObtenerDetalleTecnicoInstalacionUseCase } from './application/use-cases/obtener-detalle-tecnico-instalacion.use-case';
import { ReintentarPrealtaPppoeInstalacionUseCase } from './application/use-cases/reintentar-prealta-pppoe-instalacion.use-case';
import { ReprogramarClienteInstalacionUseCase } from './application/use-cases/reprogramar-cliente-instalacion.use-case';
import { RevelarCredencialesPppoeInstalacionUseCase } from './application/use-cases/revelar-credenciales-pppoe-instalacion.use-case';
import { SubirEvidenciaInstalacionUseCase } from './application/use-cases/subir-evidencia-instalacion.use-case';
import { CLIENTE_INSTALACION_ACCESO_REPOSITORY } from './domain/ports/cliente-instalacion-acceso-repository.port';
import { CLIENTE_INSTALACION_MEDIA_REPOSITORY } from './domain/ports/cliente-instalacion-media-repository.port';
import { CLIENTE_INSTALACION_QUERY } from './domain/ports/cliente-instalacion-query.port';
import { CLIENTE_INSTALACION_REPOSITORY } from './domain/ports/cliente-instalacion-repository.port';
import { ReautenticacionAuthAdapter } from './infra/auth/reautenticacion-auth.adapter';
import { ClienteInstalacionAccesoPrismaRepository } from './infra/prisma/cliente-instalacion-acceso-prisma.repository';
import { ClienteInstalacionMediaPrismaRepository } from './infra/prisma/cliente-instalacion-media-prisma.repository';
import { ClienteInstalacionPrismaQuery } from './infra/prisma/cliente-instalacion-prisma.query';
import { ClienteInstalacionPrismaRepository } from './infra/prisma/cliente-instalacion-prisma.repository';
import { ClienteInstalacionController } from './presentation/http/cliente-instalacion.controller';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AlmacenamientoMediaModule,
    PppoeAccesoInternetModule,
    PppoeAutomatizacionModule,
    PppoeClienteCuentaModule,
    ServicioModule,
  ],
  controllers: [ClienteInstalacionController],
  providers: [
    // Casos de uso
    CrearClienteInstalacionUseCase,
    ListarClienteInstalacionesUseCase,
    ListarMisInstalacionesAsignadasUseCase,
    ObtenerClienteInstalacionUseCase,
    ObtenerDetalleTecnicoInstalacionUseCase,
    ActualizarClienteInstalacionUseCase,
    ReprogramarClienteInstalacionUseCase,
    IniciarClienteInstalacionUseCase,
    CompletarClienteInstalacionUseCase,
    CancelarClienteInstalacionUseCase,
    SubirEvidenciaInstalacionUseCase,
    ReintentarPrealtaPppoeInstalacionUseCase,
    ActivarPppoeInstalacionUseCase,
    RevelarCredencialesPppoeInstalacionUseCase,
    // Services
    ProvisionarAccesoInstalacionService,
    ResolverPppoeInstalacionService,
    // Adaptadores
    {
      provide: CLIENTE_INSTALACION_REPOSITORY,
      useClass: ClienteInstalacionPrismaRepository,
    },
    {
      provide: CLIENTE_INSTALACION_QUERY,
      useClass: ClienteInstalacionPrismaQuery,
    },
    {
      provide: CLIENTE_INSTALACION_MEDIA_REPOSITORY,
      useClass: ClienteInstalacionMediaPrismaRepository,
    },
    {
      provide: CLIENTE_INSTALACION_ACCESO_REPOSITORY,
      useClass: ClienteInstalacionAccesoPrismaRepository,
    },
    {
      provide: REAUTENTICACION_OPERADOR,
      useClass: ReautenticacionAuthAdapter,
    },
  ],
})
export class ClienteInstalacionModule {}
