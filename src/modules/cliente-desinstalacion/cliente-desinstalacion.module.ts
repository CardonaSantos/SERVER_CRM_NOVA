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
import { CLIENTE_DESINSTALACION_REPOSITORY } from './infra/tokens/cliente-desinstalacion.token';
import { ClienteDesInstalacionPrismaRepository } from './infra/prisma/cliente-desinstalacion.prisma.repository';
import { ClienteDesInstalacionApplicationService } from './application/services/cliente-desinstalacion.service';
import { ClienteDesinstalacionController } from './presentation/cliente-instalacion.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    ClienteDesinstalacionController,
    ClienteDesinstalacionController,
  ],

  providers: [
    CrearDesinstalacionUseCase,
    ActualizarClienteDesinstalacionUseCase,
    CancelarClienteDesinstalacionUseCase,
    CompletarClienteDesinstalacionUseCase,

    ListarClienteDesinstalacionesUseCase,
    ObtenerClienteDesinstalacionUseCase,
    IniciarClienteDesinstalacionUseCase,
    ReprogramarClienteDesinstalacionUseCase,
    ActualizarCostosDesinstalacionUseCase,

    {
      provide: CLIENTE_DESINSTALACION_REPOSITORY,
      useClass: ClienteDesInstalacionPrismaRepository,
    },
  ],
  exports: [ClienteDesInstalacionApplicationService],
})
export class ClienteInstalacionModule {}
