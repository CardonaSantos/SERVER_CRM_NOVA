import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { ServicioModule } from '../servicio/servicio.module';
import { PppoePerfilHomologacionFacade } from './application/facade/pppoe-perfil-homologacion.facade';
import { ActivarPerfilHomologacionUseCase } from './application/use-cases/activar-perfil-homologacion.use-case';
import { ActualizarCodigoPerfilHomologacionUseCase } from './application/use-cases/actualizar-codigo-perfil-homologacion.use-case';
import { BuscarPerfilHomologacionUseCase } from './application/use-cases/buscar-perfil-homologacion.use-case';
import { CrearPerfilHomologacionUseCase } from './application/use-cases/crear-perfil-homologacion.use-case';
import { DesactivarPerfilHomologacionUseCase } from './application/use-cases/desactivar-perfil-homologacion.use-case';
import { ListarPerfilesHomologacionSeleccionablesUseCase } from './application/use-cases/listar-perfiles-homologacion-seleccionables.use-case';
import { ListarPerfilesHomologacionUseCase } from './application/use-cases/listar-perfiles-homologacion.use-case';
import { ObtenerPerfilHomologacionUseCase } from './application/use-cases/obtener-perfil-homologacion.use-case';
import { PERFIL_HOMOLOGACION_QUERY } from './domain/ports/perfil-homologacion-query.port';
import { PERFIL_HOMOLOGACION_REPOSITORY } from './domain/ports/perfil-homologacion-repository.port';
import { PerfilHomologacionPrismaQuery } from './infra/prisma/perfil-homologacion-prisma.query';
import { PerfilHomologacionPrismaRepository } from './infra/prisma/perfil-homologacion-prisma.repository';
import { PerfilHomologacionController } from './presentation/http/perfil-homologacion.controller';
import { PPPOE_PERFIL_HOMOLOGACION } from './public/pppoe-perfil-homologacion.facade.port';

/**
 * Homologación servicio de internet ↔ profile de MikroTik.
 *
 * API pública (`public/`): PPPOE_PERFIL_HOMOLOGACION y los tipos de
 * `pppoe-perfil-homologacion.types.ts`.
 */
@Module({
  imports: [PrismaModule, ServicioModule],
  controllers: [PerfilHomologacionController],
  providers: [
    // Casos de uso
    CrearPerfilHomologacionUseCase,
    ListarPerfilesHomologacionUseCase,
    ListarPerfilesHomologacionSeleccionablesUseCase,
    ObtenerPerfilHomologacionUseCase,
    ActualizarCodigoPerfilHomologacionUseCase,
    ActivarPerfilHomologacionUseCase,
    DesactivarPerfilHomologacionUseCase,
    BuscarPerfilHomologacionUseCase,

    // Fachada
    PppoePerfilHomologacionFacade,
    {
      provide: PPPOE_PERFIL_HOMOLOGACION,
      useExisting: PppoePerfilHomologacionFacade,
    },

    // Adaptadores
    {
      provide: PERFIL_HOMOLOGACION_REPOSITORY,
      useClass: PerfilHomologacionPrismaRepository,
    },
    {
      provide: PERFIL_HOMOLOGACION_QUERY,
      useClass: PerfilHomologacionPrismaQuery,
    },
  ],
  exports: [PPPOE_PERFIL_HOMOLOGACION],
})
export class PppoePerfilHomologacionModule {}
