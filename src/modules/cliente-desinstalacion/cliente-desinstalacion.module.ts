import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrearDesinstalacionUseCase } from './application/use-cases/crear-cliente-desinstalacion.use-case';
import { ActualizarClienteDesinstalacionUseCase } from './application/use-cases/actualizar-cliente-desinstalacion.use-case';
import { CancelarClienteDesinstalacionUseCase } from './application/use-cases/cancelar-cliente-desinstalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from './application/use-cases/completar-cliente-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from './application/use-cases/listar-cliente-desinstalaciones.use-case';
import { ObtenerClienteDesinstalacionUseCase } from './application/use-cases/obtener-cliente-desinstalacion.use-case';
import { IniciarClienteDesinstalacionUseCase } from './application/use-cases/iniciar-cliente-desinstalacion.use-case';
import { ReprogramarClienteDesinstalacionUseCase } from './application/use-cases/reprogramar-cliente-desinstalacion.use-case';
import { ActualizarCostosDesinstalacionUseCase } from './application/use-cases/actualizar-costos-desinstalacion.use-case';
import { CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from './domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import { CLIENTE_DESINSTALACION_CONTEXTO_QUERY } from './domain/ports/cliente-desinstalacion-contexto-query.port';
import { CLIENTE_DESINSTALACION_MEDIA_REPOSITORY } from './domain/ports/cliente-desinstalacion-media-repository.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from './domain/ports/cliente-desinstalacion-repository.port';
import { CLIENTE_DESINSTALACION_TECNICO_REPOSITORY } from './domain/ports/cliente-desinstalacion-tecnico-repository.port';
import { ClienteDesInstalacionPrismaRepository } from './infra/prisma/cliente-desinstalacion-prisma.repository';
import { ClienteDesInstalacionApplicationService } from './application/services/cliente-desinstalacion.service';
import { ClienteDesinstalacionController } from './presentation/http/cliente-desinstalacion.controller';
import { CrearAutorizacionDesinstalacionUseCase } from './application/use-cases/crear-autorizacion-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from './application/use-cases/listar-autorizaciones-pendientes-desinstalacion.use-case';
import { AprobarAutorizacionDesinstalacionUseCase } from './application/use-cases/aprobar-autorizacion-cliente-desinstalacion.use-case';
import { RechazarAutorizacionDesinstalacionUseCase } from './application/use-cases/rechazar-autorizacion-cliente-desinstalacion.use-case';
import { ClienteDesinstalacionAutorizacionPrismaRepository } from './infra/prisma/cliente-desinstalacion-autorizacion-prisma.repository';
import { AsignarTecnicoDesinstalacionUseCase } from './application/use-cases/asignar-tecnico-desinstalacion.use-case';
import { ListarTecnicosDesinstalacionUseCase } from './application/use-cases/listar-tecnicos-desinstalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from './application/use-cases/eliminar-tecnico-desinstalacion.use-case';
import { ClienteDesinstalacionTecnicoPrismaRepository } from './infra/prisma/cliente-desinstalacion-tecnico-prisma.repository';
import { MarcarFallidaClienteDesinstalacionUseCase } from './application/use-cases/marcar-fallida-cliente-desinstalacion.use-case';
import { ValidarAccesoDesinstalacionService } from './application/services/validar-acceso-desinstalacion.service';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';

import { ValidarAutorizacionDesinstalacionService } from './application/services/validar-autorizacion-desinstalacion.service';
import { AuthModule } from 'src/auth/auth.module';
import { PppoeAutomatizacionModule } from '../pppoe-automatizacion/pppoe-automatizacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { TipoEvidenciaClienteOperacion } from 'src/modules/cliente-instalacion/public/cliente-instalacion.types';
import { SubirEvidenciaDesinstalacionUseCase } from './application/use-cases/subir-evidencia-desinstalacion.use-case';
import { ClienteDesinstalacionMediaPrismaRepository } from './infra/prisma/cliente-desinstalacion-media-prisma.repository';
import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { ObtenerContextoCreacionDesinstalacionUseCase } from './application/use-cases/obtener-contexto-creacion-desinstalacion.use-case';
import { ClienteDesinstalacionContextoPrismaRepository } from './infra/prisma/cliente-desinstalacion-contexto-prisma.query';

@Module({
  imports: [
    PrismaModule,

    PppoeAccesoInternetModule,

    PppoeClienteCuentaModule,

    PppoeAutomatizacionModule,

    AuthModule,

    AlmacenamientoMediaModule,
  ],
  controllers: [ClienteDesinstalacionController],
  providers: [
    SubirEvidenciaDesinstalacionUseCase,
    ValidarAutorizacionDesinstalacionService,
    ClienteDesInstalacionApplicationService,
    MarcarFallidaClienteDesinstalacionUseCase,
    CrearDesinstalacionUseCase,
    ListarClienteDesinstalacionesUseCase,
    ObtenerClienteDesinstalacionUseCase,
    ActualizarClienteDesinstalacionUseCase,
    ReprogramarClienteDesinstalacionUseCase,
    IniciarClienteDesinstalacionUseCase,
    CompletarClienteDesinstalacionUseCase,
    CancelarClienteDesinstalacionUseCase,
    ActualizarCostosDesinstalacionUseCase,

    CrearAutorizacionDesinstalacionUseCase,
    ListarAutorizacionesPendientesUseCase,
    AprobarAutorizacionDesinstalacionUseCase,
    RechazarAutorizacionDesinstalacionUseCase,

    AsignarTecnicoDesinstalacionUseCase,
    ListarTecnicosDesinstalacionUseCase,
    EliminarTecnicoDesinstalacionUseCase,
    ValidarAccesoDesinstalacionService,
    ObtenerContextoCreacionDesinstalacionUseCase,

    {
      provide: CLIENTE_DESINSTALACION_REPOSITORY,
      useClass: ClienteDesInstalacionPrismaRepository,
    },
    {
      provide: CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
      useClass: ClienteDesinstalacionAutorizacionPrismaRepository,
    },
    {
      provide: CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
      useClass: ClienteDesinstalacionTecnicoPrismaRepository,
    },
    {
      provide: CLIENTE_DESINSTALACION_MEDIA_REPOSITORY,
      useClass: ClienteDesinstalacionMediaPrismaRepository,
    },

    {
      provide: CLIENTE_DESINSTALACION_CONTEXTO_QUERY,
      useClass: ClienteDesinstalacionContextoPrismaRepository,
    },
  ],
  exports: [ClienteDesInstalacionApplicationService],
})
export class ClienteDesinstalacionModule {}
