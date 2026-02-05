import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { inferExtension } from '../utils/key.util';
import { generarKey } from '../utils/key.util';

export class UploadFileUseCase {
  constructor(
    private readonly storage: FileStoragePort,
    private readonly defaults: {
      bucket: string;
      cdnBase: string;
      provider: string;
    },
  ) {}

  async execute(cmd: {
    buffer: Buffer;
    mime: string;
    fileName?: string;
    empresaId: number;
    clienteId?: number;
    tipo?: string;
    basePrefix?: string;
  }) {
    if (!cmd.buffer?.length) throw new Error('Archivo vacío');
    if (!cmd.mime?.includes('/')) throw new Error('mime inválido');

    const ext = inferExtension(cmd.mime, cmd.fileName);
    const key = generarKey({
      empresaId: cmd.empresaId,
      clienteId: cmd.clienteId,
      tipo: cmd.tipo,
      extension: ext,
      basePrefix: cmd.basePrefix ?? 'crm',
    });

    const put = await this.storage.upload({
      bucket: this.defaults.bucket,
      key,
      body: cmd.buffer,
      contentType: cmd.mime,
      cacheControl: 'public, max-age=31536000, immutable',
      acl: 'public-read',
    });

    return {
      provider: this.defaults.provider,
      bucket: put.bucket,
      key: put.key,
      cdnUrl: put.cdnUrl ?? `${this.defaults.cdnBase}/${put.key}`,
      mimeType: cmd.mime,
      extension: ext.replace('.', ''),
      size: put.size,
    };
  }
}
