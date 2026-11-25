import { Module } from '@nestjs/common';

import { PrismaModule } from 'src/prisma/prisma.module';

import { AlmacenamientoMediaFacade } from './application/facade/almacenamiento-media.facade';
import { FILE_STORAGE } from './application/ports/file-storage.port';
import { MediaKeyService } from './application/services/media-key.service';
import { EliminarArchivoUseCase } from './application/use-cases/eliminar-archivo.use-case';
import { EliminarMediaUseCase } from './application/use-cases/eliminar-media.use-case';
import { SubirArchivoUseCase } from './application/use-cases/subir-archivo.use-case';
import { SubirMediaUseCase } from './application/use-cases/subir-media.use-case';
import { MEDIA_REPOSITORY } from './domain/ports/media-repository.port';
import { almacenamientoMediaConfigProvider } from './infra/config/almacenamiento-media-config.provider';
import { MediaPrismaRepository } from './infra/prisma/media-prisma.repository';
import { MediaStorageSpacesAdapter } from './infra/spaces/media-storage-spaces.adapter';
import { MediaController } from './presentation/http/media.controller';
import { ALMACENAMIENTO_MEDIA } from './public/almacenamiento-media.facade.port';

/**
 * Almacenamiento de archivos (hoy DigitalOcean Spaces) y registro en `Media`.
 *
 * API pública (`public/`): ALMACENAMIENTO_MEDIA (fachada) y los enums de
 * `almacenamiento-media.types.ts`. ConfigService y RELOJ son globales.
 */
@Module({
  imports: [PrismaModule],
  controllers: [MediaController],
  providers: [
    // Casos de uso
    SubirMediaUseCase,
    SubirArchivoUseCase,
    EliminarMediaUseCase,
    EliminarArchivoUseCase,

    // Servicios
    MediaKeyService,

    // Fachada
    AlmacenamientoMediaFacade,
    { provide: ALMACENAMIENTO_MEDIA, useExisting: AlmacenamientoMediaFacade },

    // Configuración y adaptadores
    almacenamientoMediaConfigProvider,
    { provide: FILE_STORAGE, useClass: MediaStorageSpacesAdapter },
    { provide: MEDIA_REPOSITORY, useClass: MediaPrismaRepository },
  ],
  exports: [ALMACENAMIENTO_MEDIA],
})
export class AlmacenamientoMediaModule {}
