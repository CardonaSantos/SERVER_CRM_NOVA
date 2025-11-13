// src/modules/media/infra/storage/spaces.adapter.ts

import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import {
  FileStoragePort,
  UploadFileInput,
  UploadFileOutput,
} from '../../domain/ports/file-storage.port';

export class SpacesAdapter implements FileStoragePort {
  constructor(
    private readonly s3: S3Client,
    private readonly cfg: { defaultBucket: string; cdnBase: string },
  ) {}

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    const bucket = input.bucket || this.cfg.defaultBucket;
    // DEBUG 1 minuto:
    console.log('PutObject bucket', bucket, 'key', input.key);
    await this.s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: input.key,
        Body: input.body as any,
        ContentType: input.contentType,
        CacheControl: input.cacheControl,
        ACL: input.acl ?? 'public-read',
      }),
    );
    const size = Buffer.isBuffer(input.body)
      ? input.body.byteLength
      : undefined;
    return {
      bucket,
      key: input.key,
      size,
      contentType: input.contentType,
      cdnUrl: `${this.cfg.cdnBase}/${input.key}`,
    };
  }

  async delete(input: { bucket?: string; key: string }): Promise<void> {
    const bucket = input.bucket || this.cfg.defaultBucket;
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: bucket, Key: input.key }),
    );
  }
}
