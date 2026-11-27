import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ServicioFacade } from './application/facade/servicio.facade';
import { REAUTENTICACION_OPERADOR_SERVICIO } from './application/ports/reautenticacion-operador.port';
import { ActualizarPlanInternetUseCase } from './application/use-cases/actualizar-plan-internet.use-case';
import { ActualizarServicioAdicionalUseCase } from './application/use-cases/actualizar-servicio-adicional.use-case';
import { CambiarPrecioPlanInternetUseCase } from './application/use-cases/cambiar-precio-plan-internet.use-case';
import { CrearPlanInternetUseCase } from './application/use-cases/crear-plan-internet.use-case';
import { CrearServicioAdicionalUseCase } from './application/use-cases/crear-servicio-adicional.use-case';
import { CrearTipoServicioUseCase } from './application/use-cases/crear-tipo-servicio.use-case';
import { EliminarPlanInternetUseCase } from './application/use-cases/eliminar-plan-internet.use-case';
import { EliminarServicioAdicionalUseCase } from './application/use-cases/eliminar-servicio-adicional.use-case';
import { ListarOpcionesPlanInternetUseCase } from './application/use-cases/listar-opciones-plan-internet.use-case';
import { ListarOpcionesServicioAdicionalUseCase } from './application/use-cases/listar-opciones-servicio-adicional.use-case';
import { ListarPlanesInternetUseCase } from './application/use-cases/listar-planes-internet.use-case';
import { ListarServiciosAdicionalesUseCase } from './application/use-cases/listar-servicios-adicionales.use-case';
import { ListarTiposServicioUseCase } from './application/use-cases/listar-tipos-servicio.use-case';
import { ObtenerPlanInternetUseCase } from './application/use-cases/obtener-plan-internet.use-case';
import { ObtenerServicioAdicionalUseCase } from './application/use-cases/obtener-servicio-adicional.use-case';
import { VerificarPlanInternetUseCase } from './application/use-cases/verificar-plan-internet.use-case';
import { VerificarServiciosAsignablesUseCase } from './application/use-cases/verificar-servicios-asignables.use-case';
import { PLAN_INTERNET_QUERY } from './domain/ports/plan-internet-query.port';
import { PLAN_INTERNET_REPOSITORY } from './domain/ports/plan-internet-repository.port';
import { SERVICIO_ADICIONAL_QUERY } from './domain/ports/servicio-adicional-query.port';
import { SERVICIO_ADICIONAL_REPOSITORY } from './domain/ports/servicio-adicional-repository.port';
import { TIPO_SERVICIO_REPOSITORY } from './domain/ports/tipo-servicio-repository.port';
import { ReautenticacionAuthAdapter } from './infra/auth/reautenticacion-auth.adapter';
import { PlanInternetPrismaQuery } from './infra/prisma/plan-internet-prisma.query';
import { PlanInternetPrismaRepository } from './infra/prisma/plan-internet-prisma.repository';
import { ServicioAdicionalPrismaQuery } from './infra/prisma/servicio-adicional-prisma.query';
import { ServicioAdicionalPrismaRepository } from './infra/prisma/servicio-adicional-prisma.repository';
import { TipoServicioPrismaRepository } from './infra/prisma/tipo-servicio-prisma.repository';
import { PlanInternetController } from './presentation/http/plan-internet.controller';
import { ServicioAdicionalController } from './presentation/http/servicio-adicional.controller';
import { TipoServicioController } from './presentation/http/tipo-servicio.controller';
import { SERVICIO } from './public/servicio.facade.port';

/**
 * Catálogo de lo que se vende: planes de internet, servicios adicionales y sus
 * tipos. Nada de esto se borra físicamente.
 *
 * API pública (`public/`): la fachada `SERVICIO`. Todo módulo que anote un plan
 * o un servicio en sus tablas debe pasar por ella.
 */
@Module({
  imports: [AuthModule, PrismaModule],
  controllers: [
    PlanInternetController,
    ServicioAdicionalController,
    TipoServicioController,
  ],
  providers: [
    // Casos de uso
    CrearPlanInternetUseCase,
    ActualizarPlanInternetUseCase,
    CambiarPrecioPlanInternetUseCase,
    EliminarPlanInternetUseCase,
    ListarPlanesInternetUseCase,
    ObtenerPlanInternetUseCase,
    ListarOpcionesPlanInternetUseCase,
    VerificarPlanInternetUseCase,
    CrearServicioAdicionalUseCase,
    ActualizarServicioAdicionalUseCase,
    EliminarServicioAdicionalUseCase,
    ListarServiciosAdicionalesUseCase,
    ObtenerServicioAdicionalUseCase,
    ListarOpcionesServicioAdicionalUseCase,
    VerificarServiciosAsignablesUseCase,
    CrearTipoServicioUseCase,
    ListarTiposServicioUseCase,
    // Fachada
    ServicioFacade,
    { provide: SERVICIO, useExisting: ServicioFacade },
    // Adaptadores
    {
      provide: PLAN_INTERNET_REPOSITORY,
      useClass: PlanInternetPrismaRepository,
    },
    { provide: PLAN_INTERNET_QUERY, useClass: PlanInternetPrismaQuery },
    {
      provide: SERVICIO_ADICIONAL_REPOSITORY,
      useClass: ServicioAdicionalPrismaRepository,
    },
    {
      provide: SERVICIO_ADICIONAL_QUERY,
      useClass: ServicioAdicionalPrismaQuery,
    },
    {
      provide: TIPO_SERVICIO_REPOSITORY,
      useClass: TipoServicioPrismaRepository,
    },
    {
      provide: REAUTENTICACION_OPERADOR_SERVICIO,
      useClass: ReautenticacionAuthAdapter,
    },
  ],
  exports: [SERVICIO],
})
export class ServicioModule {}
