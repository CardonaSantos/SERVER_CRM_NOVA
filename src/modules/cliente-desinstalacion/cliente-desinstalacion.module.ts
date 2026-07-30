import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrearDesinstalacionUseCase } from './application/use-cases/crear-desinstalacion.use-case';
import { ActualizarClienteDesinstalacionUseCase } from './application/use-cases/actualizar-desinstalacion-cliente.dto';
import { CancelarClienteDesinstalacionUseCase } from './application/use-cases/cancelar-cliente-desinstalacion.use-case';
import { CompletarClienteDesinstalacionUseCase } from './application/use-cases/completar-cliente-desinstalacion.use-case';
import { ListarClienteDesinstalacionesUseCase } from './application/use-cases/listar-clientes-desinstalaciones.use-case';
import { ObtenerClienteDesinstalacionUseCase } from './application/use-cases/obtener-cliente-desinstalacion.use-case';
import { IniciarClienteDesinstalacionUseCase } from './application/use-cases/iniciar-cliente-desintalacion.use-case';
import { ReprogramarClienteDesinstalacionUseCase } from './application/use-cases/reprogramar-desinstalacion.use-case';
import { ActualizarCostosDesinstalacionUseCase } from './application/use-cases/actualizar-costos-desinstalacion.use-case';
import {
  CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY,
  CLIENTE_DESINSTALACION_REPOSITORY,
  CLIENTE_DESINSTALACION_TECNICO_REPOSITORY,
} from './infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionPrismaRepository } from './infra/prisma/cliente-desinstalacion.prisma.repository';
import { ClienteDesInstalacionApplicationService } from './application/services/cliente-desinstalacion.service';
import { ClienteDesinstalacionController } from './presentation/cliente-desinstalacion.controller';
import { CrearAutorizacionDesinstalacionUseCase } from './application/use-cases/crear-autorizacion-cliente-desinstalacion.use-case';
import { ListarAutorizacionesPendientesUseCase } from './application/use-cases/listar-autorizacion-cliente-desintalacion.use-case';
import { AprobarAutorizacionDesinstalacionUseCase } from './application/use-cases/aprobar-autorizacion-cliente-desinstalacion.use-case';
import { RechazarAutorizacionDesinstalacionUseCase } from './application/use-cases/rechazar-autorizacion-cliente-desinstalacion.use-case';
import { ClienteDesinstalacionAutorizacionPrismaRepository } from './infra/prisma/cliente-desinstalacion-autorizacion.repository';
import { AsignarTecnicoDesinstalacionUseCase } from './application/use-cases/asignar-tecnico-desinstalacion.use-case';
import { ListarTecnicosDesinstalacionUseCase } from './application/use-cases/listar-tecnicos-desintalacion.use-case';
import { EliminarTecnicoDesinstalacionUseCase } from './application/use-cases/eliminar-tecnico-desinstalacion.use-case';
import { ClienteDesinstalacionTecnicoPrismaRepository } from './infra/prisma/cliente-desinstalacion-tecnico.prisma.repository';
import { MarcarFallidaClienteDesinstalacionUseCase } from './application/use-cases/marcar-fallida-cliente-desinstalacion.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ClienteDesinstalacionController],
  providers: [
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
  ],
  exports: [ClienteDesInstalacionApplicationService],
})
export class ClienteDesinstalacionModule {}
