import {
  FileStoragePort,
  UploadFileInput,
  UploadFileOutput,
} from '../../application/ports/file-storage.port';

/** Almacenamiento en memoria para pruebas. */
export class FileStorageFake implements FileStoragePort {
  readonly subidos: UploadFileInput[] = [];

  readonly borrados: { bucket?: string; key: string }[] = [];

  async upload(input: UploadFileInput): Promise<UploadFileOutput> {
    this.subidos.push(input);

    return {
      bucket: input.bucket ?? 'bucket-por-defecto',
      key: input.key,
      size: Buffer.isBuffer(input.body) ? input.body.byteLength : undefined,
      contentType: input.contentType,
      cdnUrl: `https://cdn.prueba/${input.key}`,
    };
  }

  async delete(input: { bucket?: string; key: string }): Promise<void> {
    this.borrados.push(input);
  }
}
