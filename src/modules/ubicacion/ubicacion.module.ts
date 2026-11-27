import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UbicacionFacade } from './application/facade/ubicacion.facade';
import { ActualizarSectorUseCase } from './application/use-cases/actualizar-sector.use-case';
import { CrearSectorUseCase } from './application/use-cases/crear-sector.use-case';
import { EliminarSectorUseCase } from './application/use-cases/eliminar-sector.use-case';
import { ListarDepartamentosUseCase } from './application/use-cases/listar-departamentos.use-case';
import { ListarMunicipiosUseCase } from './application/use-cases/listar-municipios.use-case';
import { ListarOpcionesSectorUseCase } from './application/use-cases/listar-opciones-sector.use-case';
import { ListarSectoresUseCase } from './application/use-cases/listar-sectores.use-case';
import { ObtenerSectorUseCase } from './application/use-cases/obtener-sector.use-case';
import { VerificarUbicacionAsignadaUseCase } from './application/use-cases/verificar-ubicacion-asignada.use-case';
import { DIVISION_TERRITORIAL_QUERY } from './domain/ports/division-territorial-query.port';
import { SECTOR_QUERY } from './domain/ports/sector-query.port';
import { SECTOR_REPOSITORY } from './domain/ports/sector-repository.port';
import { DivisionTerritorialPrismaQuery } from './infra/prisma/division-territorial-prisma.query';
import { SectorPrismaQuery } from './infra/prisma/sector-prisma.query';
import { SectorPrismaRepository } from './infra/prisma/sector-prisma.repository';
import { DivisionTerritorialController } from './presentation/http/division-territorial.controller';
import { SectorController } from './presentation/http/sector.controller';
import { UBICACION } from './public/ubicacion.facade.port';

/**
 * Departamentos y municipios (catálogo de solo lectura) y sectores. Un sector
 * nunca se borra físicamente. Las coordenadas de cada cliente son de `cliente`.
 *
 * API pública (`public/`): la fachada `UBICACION`.
 */
@Module({
  imports: [PrismaModule],
  controllers: [SectorController, DivisionTerritorialController],
  providers: [
    // Casos de uso
    CrearSectorUseCase,
    ActualizarSectorUseCase,
    EliminarSectorUseCase,
    ListarSectoresUseCase,
    ObtenerSectorUseCase,
    ListarOpcionesSectorUseCase,
    ListarDepartamentosUseCase,
    ListarMunicipiosUseCase,
    VerificarUbicacionAsignadaUseCase,
    // Fachada
    UbicacionFacade,
    { provide: UBICACION, useExisting: UbicacionFacade },
    // Adaptadores
    { provide: SECTOR_REPOSITORY, useClass: SectorPrismaRepository },
    { provide: SECTOR_QUERY, useClass: SectorPrismaQuery },
    {
      provide: DIVISION_TERRITORIAL_QUERY,
      useClass: DivisionTerritorialPrismaQuery,
    },
  ],
  exports: [UBICACION],
})
export class UbicacionModule {}
