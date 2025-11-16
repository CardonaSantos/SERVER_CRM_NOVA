// src/modules/digital-ocean-media/digital-ocean-media.module.ts
import { Module } from '@nestjs/common';
import {
  S3Client,
  HeadBucketCommand, // pre-flight
} from '@aws-sdk/client-s3';

import { MediaController } from './http/media.controller';
import { SubirMediaUseCase } from './application/use-cases/subir-media.usecase';
import { SpacesAdapter } from './infraestructure/storage/spaces.adapter';
import { PrismaMediaRepository } from './infraestructure/persistence/prisma-media.repository';

import {
  ELIMINAR_MEDIA_USECASE,
  MEDIA_REPOSITORY,
  SPACES_CFG,
  SPACES_S3,
  STORAGE_PORT,
  SUBIR_MEDIA_USECASE,
} from './tokens/tokens';
import { PrismaService } from 'src/prisma/prisma.service';
import { FileStoragePort } from './domain/ports/file-storage.port';
import { MediaRepositoryPort } from './domain/ports/media-repository.port';
import { EliminarMediaUseCase } from './application/use-cases/eliminar-media.usecase';

@Module({
  controllers: [MediaController],
  providers: [
    PrismaService,
    // 1) Config desde .env (DO_SPACES_*)
    {
      provide: SPACES_CFG,
      useFactory: () => {
        const cfg = {
          region: process.env.DO_SPACES_REGION,
          endpoint: process.env.DO_SPACES_ENDPOINT,
          accessKeyId: process.env.DO_SPACES_KEY,
          secretAccessKey: process.env.DO_SPACES_SECRET,
          defaultBucket: process.env.DO_SPACES_BUCKET,
          cdnBase: process.env.DO_SPACES_CDN_BASE,
        };
        for (const [k, v] of Object.entries(cfg)) {
          if (!v) throw new Error(`Falta variable de entorno: ${k}`);
        }
        // console.log('SPACES CFG ->', cfg); // <- descomenta si deseas depurar
        return cfg;
      },
    },

    //  Eliminar media
    {
      provide: ELIMINAR_MEDIA_USECASE,
      useFactory: (storage: FileStoragePort, repo: MediaRepositoryPort) =>
        new EliminarMediaUseCase(storage, repo),
      inject: [STORAGE_PORT, MEDIA_REPOSITORY],
    },

    // 2) Cliente S3 apuntando a DO (path-style recomendado)
    {
      provide: SPACES_S3,
      useFactory: (cfg: any) =>
        new S3Client({
          region: cfg.region, // ej. "sfo3"
          endpoint: cfg.endpoint, // ej. "https://sfo3.digitaloceanspaces.com"
          forcePathStyle: true, // evita problemas de NoSuchBucket
          credentials: {
            accessKeyId: cfg.accessKeyId,
            secretAccessKey: cfg.secretAccessKey,
          },
        }),
      inject: [SPACES_CFG],
    },

    // 3) Pre-flight: valida bucket/región/credenciales al boot
    {
      provide: 'SPACES_BOOT_CHECK',
      useFactory: async (s3: S3Client, cfg: any) => {
        await s3.send(new HeadBucketCommand({ Bucket: cfg.defaultBucket }));
        return true;
      },
      inject: [SPACES_S3, SPACES_CFG],
    },

    // 4) Adapter de storage (FileStoragePort)
    {
      provide: STORAGE_PORT,
      useFactory: (s3: S3Client, cfg: any) =>
        new SpacesAdapter(s3, {
          defaultBucket: cfg.defaultBucket,
          cdnBase: cfg.cdnBase,
        }),
      inject: [SPACES_S3, SPACES_CFG],
    },

    // 5) Repo Prisma
    {
      provide: MEDIA_REPOSITORY,
      useClass: PrismaMediaRepository,
    },

    // 6) Caso de uso: Subir media
    {
      provide: SUBIR_MEDIA_USECASE,
      useFactory: (storage, repo, cfg) =>
        new SubirMediaUseCase(storage, repo, {
          bucket: cfg.defaultBucket,
          cdnBase: cfg.cdnBase,
          provider: 'do-spaces',
        }),
      inject: [STORAGE_PORT, MEDIA_REPOSITORY, SPACES_CFG],
    },
  ],
  exports: [SUBIR_MEDIA_USECASE],
})
export class DigitalOceanMediaModule {}
