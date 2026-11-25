// src/modules/media/domain/ports/storage.port.ts

import { Readable } from 'stream';

// Lo que necesita el caso de uso para subir al storage
export type UploadFileInput = {
  bucket?: string; // si no viene, el adapter usa su bucket por defecto
  key: string; // la genera el caso de uso (empresa/cliente/fecha/uuid.ext)
  body: Buffer | Readable; // contenido binario/stream
  contentType: string; // ej. "image/webp"
  cacheControl?: string; // ej. "public, max-age=31536000, immutable"
  acl?: 'public-read' | 'private'; // para DO+CDN público: 'public-read'
};

// Respuesta mínima útil desde el storage
export type UploadFileOutput = {
  bucket: string;
  key: string;
  size?: number; // bytes (si el SDK lo expone)
  contentType?: string;
  etag?: string; // ojo: en S3 multi-part NO es md5 real
  cdnUrl?: string; // el adapter puede construirla: CDN_BASE + '/' + key
};

export interface FileStoragePort {
  upload(input: UploadFileInput): Promise<UploadFileOutput>;
  delete(input: { bucket?: string; key: string }): Promise<void>;
}
