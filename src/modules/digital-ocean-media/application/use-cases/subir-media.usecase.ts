// src/modules/media/application/use-cases/subir-media.usecase.ts
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
    // 1) Validaciones mínimas
    if (!cmd.empresaId) throw new Error('empresaId requerido');
    if (!cmd.buffer?.length) throw new Error('Archivo vacío');
    if (!cmd.mime?.includes('/')) throw new Error('mime inválido');

    // 2) Generar key (usa tu convención)
    const ext = inferExtension(cmd.mime, cmd.fileName);
    const key = generarKey({
      empresaId: cmd.empresaId,
      clienteId: cmd.clienteId,
      albumId: cmd.albumId, // opcional: para meter albums en la ruta
      tipo: cmd.tipo, // opcional: para carpeta por tipo (imagenes/videos)
      extension: ext, // 👈 la extensión real
      basePrefix: cmd.basePrefix ?? process.env.MEDIA_BASE_PREFIX ?? 'crm', // 👈 prefijo
    });

    // 3) Subir a storage (ACL pública + CDN)
    const put = await this.storage.upload({
      bucket: this.defaults.bucket,
      key,
      body: cmd.buffer,
      contentType: cmd.mime,
      cacheControl: 'public, max-age=31536000, immutable',
      acl: 'public-read',
    });

    // 4) Construir entidad de dominio
    const asset: MediaAsset = {
      empresaId: cmd.empresaId,
      clienteId: cmd.clienteId,
      albumId: cmd.albumId,
      subidoPorId: cmd.subidoPorId,
      provider: this.defaults.provider,
      bucket: put.bucket,
      key: put.key,
      cdnUrl: put.cdnUrl ?? `${this.defaults.cdnBase}/${put.key}`,
      mimeType: cmd.mime,
      extension: ext.replace('.', ''),
      tamanioBytes: put.size,
      categoria: cmd.categoria as any,
      tipo: cmd.tipo,
      publico: cmd.publico,
      estado: 'LISTO',
      titulo: cmd.titulo,
      descripcion: cmd.descripcion,
      etiqueta: cmd.etiqueta,
      creadoEn: new Date(),
    };

    // 5) Guardar en DB
    const saved = await this.repo.guardar(asset);

    // 6) Respuesta
    return {
      id: saved.id!,
      cdnUrl: saved.cdnUrl,
      bucket: saved.bucket!,
      key: saved.key,
      tipo: saved.tipo,
    };
  }
}
