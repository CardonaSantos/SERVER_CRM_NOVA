import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PpoePerfilHomologacionController } from './presentation/ppoe-perfil-homologacion.controller';
import { PpoePerfilHomologacionService } from './application/services/ppoe-perfil-homologacion.service';
import { CrearPerfilHomologacionUseCase } from './application/use-cases/crear-perfil-homologacion.use-case';
import { ObtenerPerfilHomologacionUseCase } from './application/use-cases/obtener-perfil-homologacion.use-case';
import { ActualizarCodigoPerfilHomologacionUseCase } from './application/use-cases/actualizar-codigo-perfil-homologacion.use-case';
import { ActivarPerfilHomologacionUseCase } from './application/use-cases/activar-perfil-homologacion.use-case';
import { DesactivarPerfilHomologacionUseCase } from './application/use-cases/desactivar-perfil-homologacion.use-case';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from './infra/tokens/ppoe-perfil-homologacion.token';
import { PerfilHomologacionPrismaRepository } from './infra/prisma/ppoe-perfil-homologacion.prisma.repository';
import { ListarPerfilesHomologacionUseCase } from './application/use-cases/listar-perfiles-homologacion.use-case';
import { ListarPerfilesHomologacionSeleccionablesUseCase } from './application/use-cases/listar-perfiles-homologacion-seleccionables.use-case';

@Module({
  imports: [PrismaModule],

  controllers: [PpoePerfilHomologacionController],

  providers: [
    PpoePerfilHomologacionService,
    ListarPerfilesHomologacionUseCase,
    CrearPerfilHomologacionUseCase,
    ObtenerPerfilHomologacionUseCase,
    ActualizarCodigoPerfilHomologacionUseCase,
    ActivarPerfilHomologacionUseCase,
    DesactivarPerfilHomologacionUseCase,
    ListarPerfilesHomologacionSeleccionablesUseCase,

    {
      provide: PPPOE_PERFIL_HOMOLOGACION_REPOSITORY,
      useClass: PerfilHomologacionPrismaRepository,
    },
  ],

  exports: [PPPOE_PERFIL_HOMOLOGACION_REPOSITORY],
})
export class PppoePerfilHomologacionModule {}
