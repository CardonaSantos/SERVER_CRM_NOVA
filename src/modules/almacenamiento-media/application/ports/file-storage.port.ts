import type { Readable } from 'stream';

export const FILE_STORAGE = Symbol('FILE_STORAGE');

/** Lo que necesita un caso de uso para subir un archivo al almacenamiento. */
export type UploadFileInput = {
  /** Si no viene, el adaptador usa su bucket por defecto. */
  bucket?: string;
  /** La genera el caso de uso (MediaKeyService). */
  key: string;
  body: Buffer | Readable;
  contentType: string;
  cacheControl?: string;
  acl?: 'public-read' | 'private';
};

export type UploadFileOutput = {
  bucket: string;
  key: string;
  size?: number;
  contentType?: string;
  etag?: string;
  cdnUrl?: string;
};

/** Almacenamiento de objetos (hoy DigitalOcean Spaces vía S3). */
export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;

  delete(input: { bucket?: string; key: string }): Promise<void>;
}
