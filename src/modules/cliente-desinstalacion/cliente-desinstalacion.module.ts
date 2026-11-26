import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AlmacenamientoMediaModule } from '../almacenamiento-media/almacenamiento-media.module';
import { ClienteModule } from '../cliente/cliente.module';
import { PppoeAccesoInternetModule } from '../pppoe-acceso-internet/pppoe-acceso-internet.module';
import { PppoeAutomatizacionModule } from '../pppoe-automatizacion/pppoe-automatizacion.module';
import { PppoeClienteCuentaModule } from '../pppoe-cliente-cuenta/pppoe-cliente-cuenta.module';
import { REAUTENTICACION_OPERADOR } from './application/ports/reautenticacion-operador.port';
import { CerrarDesinstalacionService } from './application/services/cerrar-desinstalacion.service';
import { ValidarAccesoDesinstalacionService } from './application/services/validar-acceso-desinstalacion.service';
import { ValidarAutorizacionDesinstalacionService } from './application/services/validar-autorizacion-desinstalacion.service';
import { ActualizarClienteDesinstalacionUseCase } from './application/use-cases/actualizar-cliente-desinstalacion.use-case';
import { ActualizarCostosDesinstalacionUseCase } from './application/use-cases/actualizar-costos-desinstalacion.use-case';
import { AprobarAutorizacionDesinstalacionUseCase } from './application/use-cases/aprobar-autorizacion-cliente-desinstalacion.use-case';
import { AsignarTecnicoDesinstalacionUseCase } from './application/use-cases/asignar-tecnico-desinstalacion.use-case';
import { CancelarClienteDesinstalacionUseCase } from './application/use-cases/cancelar-cliente-desinstalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from './application/use-cases/completar-cliente-desinstalacion.use-case';
import { CrearAutorizacionDesinstalacionUseCase } from './application/use-cases/crear-autorizacion-cliente-desinstalacion.use-case';
import { CrearClienteDesinstalacionUseCase } from './application/use-cases/crear-cliente-desinstalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from './application/use-cases/eliminar-tecnico-desinstalacion.use-case';
import { IniciarClienteDesinstalacionUseCase } from './application/use-cases/iniciar-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from './application/use-cases/listar-autorizaciones-pendientes-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from './application/use-cases/listar-cliente-desinstalaciones.use-case';
import { ListarTecnicosDesinstalacionUseCase } from './application/use-cases/listar-tecnicos-desinstalacion.use-case';
import { MarcarFallidaClienteDesinstalacionUseCase } from './application/use-cases/marcar-fallida-cliente-desinstalacion.use-case';
import { ObtenerClienteDesinstalacionUseCase } from './application/use-cases/obtener-cliente-desinstalacion.use-case';
import { ObtenerContextoCreacionDesinstalacionUseCase } from './application/use-cases/obtener-contexto-creacion-desinstalacion.use-case';
import { RechazarAutorizacionDesinstalacionUseCase } from './application/use-cases/rechazar-autorizacion-cliente-desinstalacion.use-case';
import { ReprogramarClienteDesinstalacionUseCase } from './application/use-cases/reprogramar-cliente-desinstalacion.use-case';
import { SubirEvidenciaDesinstalacionUseCase } from './application/use-cases/subir-evidencia-desinstalacion.use-case';
import { AUTORIZACION_DESINSTALACION_QUERY } from './domain/ports/autorizacion-desinstalacion-query.port';
import { CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from './domain/ports/cliente-desinstalacion-autorizacion-repository.port';
import { CLIENTE_DESINSTALACION_CONTEXTO_QUERY } from './domain/ports/cliente-desinstalacion-contexto-query.port';
import { CLIENTE_DESINSTALACION_MEDIA_REPOSITORY } from './domain/ports/cliente-desinstalacion-media-repository.port';
import { CLIENTE_DESINSTALACION_QUERY } from './domain/ports/cliente-desinstalacion-query.port';
import { CLIENTE_DESINSTALACION_REPOSITORY } from './domain/ports/cliente-desinstalacion-repository.port';
import { CLIENTE_DESINSTALACION_TECNICO_REPOSITORY } from './domain/ports/cliente-desinstalacion-tecnico-repository.port';
import { ReautenticacionAuthAdapter } from './infra/auth/reautenticacion-auth.adapter';
import { AutorizacionDesinstalacionPrismaQuery } from './infra/prisma/autorizacion-desinstalacion-prisma.query';
import { ClienteDesinstalacionAutorizacionPrismaRepository } from './infra/prisma/cliente-desinstalacion-autorizacion-prisma.repository';
import { ClienteDesinstalacionContextoPrismaQuery } from './infra/prisma/cliente-desinstalacion-contexto-prisma.query';
import { ClienteDesinstalacionMediaPrismaRepository } from './infra/prisma/cliente-desinstalacion-media-prisma.repository';
import { ClienteDesinstalacionPrismaQuery } from './infra/prisma/cliente-desinstalacion-prisma.query';
import { ClienteDesinstalacionPrismaRepository } from './infra/prisma/cliente-desinstalacion-prisma.repository';
import { ClienteDesinstalacionTecnicoPrismaRepository } from './infra/prisma/cliente-desinstalacion-tecnico-prisma.repository';
import { ClienteDesinstalacionController } from './presentation/http/cliente-desinstalacion.controller';

@Module({
  imports: [
    AuthModule,
    PrismaModule,
    AlmacenamientoMediaModule,
    ClienteModule,
    PppoeAccesoInternetModule,
    PppoeAutomatizacionModule,
    PppoeClienteCuentaModule,
  ],
  controllers: [ClienteDesinstalacionController],
  providers: [
    // Casos de uso
    CrearClienteDesinstalacionUseCase,
    ListarClienteDesinstalacionesUseCase,
    ObtenerClienteDesinstalacionUseCase,
    ObtenerContextoCreacionDesinstalacionUseCase,
    ActualizarClienteDesinstalacionUseCase,
    ReprogramarClienteDesinstalacionUseCase,
    ActualizarCostosDesinstalacionUseCase,
    IniciarClienteDesinstalacionUseCase,
    CompletarClienteDesinstalacionUseCase,
    CancelarClienteDesinstalacionUseCase,
    MarcarFallidaClienteDesinstalacionUseCase,
    SubirEvidenciaDesinstalacionUseCase,
    CrearAutorizacionDesinstalacionUseCase,
    ListarAutorizacionesPendientesUseCase,
    AprobarAutorizacionDesinstalacionUseCase,
    RechazarAutorizacionDesinstalacionUseCase,
    AsignarTecnicoDesinstalacionUseCase,
    ListarTecnicosDesinstalacionUseCase,
    EliminarTecnicoDesinstalacionUseCase,
    // Services
    CerrarDesinstalacionService,
    ValidarAccesoDesinstalacionService,
    ValidarAutorizacionDesinstalacionService,
    // Adaptadores
    {
      provide: CLIENTE_DESINSTALACION_REPOSITORY,
      useClass: ClienteDesinstalacionPrismaRepository,
    },
    {
      provide: CLIENTE_DESINSTALACION_QUERY,
      useClass: ClienteDesinstalacionPrismaQuery,
    },
    {
      provide: CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
      useClass: ClienteDesinstalacionAutorizacionPrismaRepository,
    },
    {
      provide: AUTORIZACION_DESINSTALACION_QUERY,
      useClass: AutorizacionDesinstalacionPrismaQuery,
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
      useClass: ClienteDesinstalacionContextoPrismaQuery,
    },
    {
      provide: REAUTENTICACION_OPERADOR,
      useClass: ReautenticacionAuthAdapter,
    },
  ],
})
export class ClienteDesinstalacionModule {}
