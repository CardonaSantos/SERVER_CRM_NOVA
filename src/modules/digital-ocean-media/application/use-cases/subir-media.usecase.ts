import { TipoMedia } from '@prisma/client';
import { MediaAsset } from '../../domain/file-aset';
import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { MediaRepositoryPort } from '../../domain/ports/media-repository.port';
import { SubirMediaCommand, SubirMediaResult } from '../dto/subir-media.dto';
import { generarKey, inferExtension } from '../utils/key.util';

export class SubirMediaUseCase {
  constructor(
    private readonly storage: FileStoragePort,
    private readonly repo: MediaRepositoryPort,
    private readonly defaults: {
      bucket: string;
      cdnBase: string;
      provider: 'do-spaces';
    },
  ) {}

  async execute(cmd: SubirMediaCommand): Promise<SubirMediaResult> {
    if (!cmd.empresaId) {
      throw new Error('empresaId requerido');
    }

    if (!cmd.buffer?.length) {
      throw new Error('Archivo vacío');
    }

    const archivoDetectado = this.detectarArchivoReal({
      buffer: cmd.buffer,

      mimeDeclarado: cmd.mime,

      tipoDeclarado: cmd.tipo,
    });

    console.log({
      fileName: cmd.fileName,

      mimeDeclarado: cmd.mime,

      mimeDetectado: archivoDetectado.mime,

      tipoDeclarado: cmd.tipo,

      tipoDetectado: archivoDetectado.tipo,

      size: cmd.buffer.length,

      primerosBytes: cmd.buffer.subarray(0, 12).toString('hex'),
    });

    if (!archivoDetectado.mime.includes('/')) {
      throw new Error('mime inválido');
    }

    const ext = inferExtension(archivoDetectado.mime, cmd.fileName);

    const key = generarKey({
      empresaId: cmd.empresaId,

      clienteId: cmd.clienteId,

      albumId: cmd.albumId,

      tipo: archivoDetectado.tipo,

      extension: ext,

      basePrefix: cmd.basePrefix ?? process.env.MEDIA_BASE_PREFIX ?? 'crm',
    });

    const put = await this.storage.upload({
      bucket: this.defaults.bucket,

      key,

      body: cmd.buffer,

      contentType: archivoDetectado.mime,

      cacheControl: 'public, max-age=31536000, immutable',

      acl: 'public-read',
    });

    const asset: MediaAsset = {
      empresaId: cmd.empresaId,

      clienteId: cmd.clienteId,

      albumId: cmd.albumId,

      subidoPorId: cmd.subidoPorId,

      provider: this.defaults.provider,

      bucket: put.bucket,

      key: put.key,

      cdnUrl: put.cdnUrl ?? `${this.defaults.cdnBase}/${put.key}`,

      mimeType: archivoDetectado.mime,

      extension: ext.replace('.', ''),

      tamanioBytes: put.size,

      categoria: cmd.categoria,

      tipo: archivoDetectado.tipo,

      publico: cmd.publico,

      estado: 'LISTO',

      titulo: cmd.titulo,

      descripcion: cmd.descripcion,

      etiqueta: cmd.etiqueta,

      creadoEn: new Date(),
    };

    const saved = await this.repo.guardar(asset);

    return {
      id: saved.id!,

      cdnUrl: saved.cdnUrl,

      bucket: saved.bucket!,

      key: saved.key,

      tipo: saved.tipo,
    };
  }

  private detectarArchivoReal(params: {
    buffer: Buffer;

    mimeDeclarado: string;

    tipoDeclarado: TipoMedia;
  }): {
    mime: string;

    tipo: TipoMedia;
  } {
    const { buffer, mimeDeclarado, tipoDeclarado } = params;

    /*
     * JPEG:
     * FF D8 FF
     */
    if (
      buffer.length >= 3 &&
      buffer[0] === 0xff &&
      buffer[1] === 0xd8 &&
      buffer[2] === 0xff
    ) {
      return {
        mime: 'image/jpeg',

        tipo: TipoMedia.IMAGEN,
      };
    }

    /*
     * PNG:
     * 89 50 4E 47 0D 0A 1A 0A
     */
    const firmaPng = Buffer.from([
      0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
    ]);

    if (
      buffer.length >= firmaPng.length &&
      buffer.subarray(0, firmaPng.length).equals(firmaPng)
    ) {
      return {
        mime: 'image/png',

        tipo: TipoMedia.IMAGEN,
      };
    }

    /*
     * WEBP:
     * RIFF....WEBP
     */
    if (
      buffer.length >= 12 &&
      buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
      buffer.subarray(8, 12).toString('ascii') === 'WEBP'
    ) {
      return {
        mime: 'image/webp',

        tipo: TipoMedia.IMAGEN,
      };
    }

    /*
     * GIF:
     * GIF87a o GIF89a
     */
    const firmaGif = buffer.subarray(0, 6).toString('ascii');

    if (firmaGif === 'GIF87a' || firmaGif === 'GIF89a') {
      return {
        mime: 'image/gif',

        tipo: TipoMedia.IMAGEN,
      };
    }

    /*
     * PDF:
     * %PDF
     */
    if (
      buffer.length >= 4 &&
      buffer.subarray(0, 4).toString('ascii') === '%PDF'
    ) {
      return {
        mime: 'application/pdf',

        tipo: TipoMedia.DOCUMENTO,
      };
    }

    const mimeNormalizado = mimeDeclarado?.trim().toLowerCase();

    if (!mimeNormalizado?.includes('/')) {
      throw new Error('No fue posible determinar el tipo MIME del archivo.');
    }

    /*
     * Para formatos no detectados mediante firma,
     * conserva el MIME y el tipo declarados.
     */
    return {
      mime: mimeNormalizado,

      tipo: tipoDeclarado,
    };
  }
}
