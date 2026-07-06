import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CrearClienteInstalacionUseCase } from './application/use-cases/crear-cliente-instalacion.use-case';
import { ListarClienteInstalacionesUseCase } from './application/use-cases/listar-cliente-instalaciones.use-case';
import { ObtenerClienteInstalacionUseCase } from './application/use-cases/obtener-cliente-instalacion.use-case';
import { ClienteInstalacionController } from './presentation/cliente-instalacion.controller';
import { CLIENTE_INSTALACION_REPOSITORY } from './infra/tokens/cliente-instalacion.tokens';
import { ClienteInstalacionApplicationService } from './application/services/cliente-instalacion.aplication-service.service';
import { ClienteInstalacionPrismaRepository } from './infra/prisma/cliente-instalacion.prisma.repository';
import { ActualizarClienteInstalacionUseCase } from './application/use-cases/actualizar-cliente-instalacion.use-case';
import { ReprogramarInstalacionClienteUseCase } from './application/use-cases/reprogramar-cliente-instalacion.use-case';
import { IniciarClienteInstalacionUseCase } from './application/use-cases/iniciar-cliente-instalacion.use-case';
import { CompletarClienteInstalacionUseCase } from './application/use-cases/completar-cliente-instalacion.use-case';
import { CancelarClienteInstalacionUseCase } from './application/use-cases/cancelar-cliente-instalacion.use-case';

@Module({
  imports: [PrismaModule],
  controllers: [ClienteInstalacionController],
  providers: [
    ClienteInstalacionApplicationService,

    CrearClienteInstalacionUseCase,
    ListarClienteInstalacionesUseCase,
    ObtenerClienteInstalacionUseCase,
    ActualizarClienteInstalacionUseCase,
    ReprogramarInstalacionClienteUseCase,
    IniciarClienteInstalacionUseCase,
    CompletarClienteInstalacionUseCase,
    CancelarClienteInstalacionUseCase,

    {
      provide: CLIENTE_INSTALACION_REPOSITORY,
      useClass: ClienteInstalacionPrismaRepository,
    },
  ],
  exports: [ClienteInstalacionApplicationService],
})
export class ClienteInstalacionModule {}
