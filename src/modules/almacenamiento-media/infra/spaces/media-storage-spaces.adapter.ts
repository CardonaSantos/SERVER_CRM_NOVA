import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DeleteObjectCommand,
  HeadBucketCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';

import {
  FileStoragePort,
  UploadFileInput,
  UploadFileOutput,
} from '../../application/ports/file-storage.port';

const VARIABLES_REQUERIDAS = [
  'DO_SPACES_REGION',
  'DO_SPACES_ENDPOINT',
  'DO_SPACES_KEY',
  'DO_SPACES_SECRET',
  'DO_SPACES_BUCKET',
  'DO_SPACES_CDN_BASE',
] as const;

/**
 * Almacenamiento en DigitalOcean Spaces (API S3, path-style).
 *
 * Al arrancar valida el bucket (HeadBucket); si falla solo lo registra,
 * como antes: la app arranca igual. Nunca registra credenciales ni keys.
 */
@Injectable()
export class MediaStorageSpacesAdapter
  implements FileStoragePort, OnModuleInit
{
  private readonly logger = new Logger(MediaStorageSpacesAdapter.name);

  private readonly s3: S3Client;

  private readonly bucketPorDefecto: string;

  private readonly cdnBase: string;

  constructor(config: ConfigService) {
    for (const nombre of VARIABLES_REQUERIDAS) {
      if (!config.get<string>(nombre)) {
        throw new Error(`Falta variable de entorno: ${nombre}`);
      }
    }

    this.bucketPorDefecto = config.get<string>('DO_SPACES_BUCKET')!;
    this.cdnBase = config.get<string>('DO_SPACES_CDN_BASE')!;

    this.s3 = new S3Client({
      region: config.get<string>('DO_SPACES_REGION'),
      endpoint: config.get<string>('DO_SPACES_ENDPOINT'),
      forcePathStyle: true, // evita NoSuchBucket con Spaces
      credentials: {
        accessKeyId: config.get<string>('DO_SPACES_KEY')!,
        secretAccessKey: config.get<string>('DO_SPACES_SECRET')!,
      },
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.s3.send(
        new HeadBucketCommand({ Bucket: this.bucketPorDefecto }),
      );
      this.logger.log('Bucket de almacenamiento validado.');
    } catch (error) {
      const e = error as {
        name?: string;
        $metadata?: { httpStatusCode?: number };
      };
      this.logger.error(
        `No se pudo validar el bucket al iniciar: ${e?.name ?? 'error'} (HTTP ${e?.$metadata?.httpStatusCode ?? '-'})`,
      );
    }
  }

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    const bucket = input.bucket || this.bucketPorDefecto;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        ACL: input.acl ?? 'public-read',
      }),
    );

    return {
      bucket,
      key: input.key,
      size: Buffer.isBuffer(input.body) ? input.body.byteLength : undefined,
      contentType: input.contentType,
      cdnUrl: `${this.cdnBase}/${input.key}`,
    };
  }

  async delete(input: { bucket?: string; key: string }): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({
        Bucket: input.bucket || this.bucketPorDefecto,
        Key: input.key,
      }),
    );
  }
}
