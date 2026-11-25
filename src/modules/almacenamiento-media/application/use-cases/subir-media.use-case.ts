import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import { EstadoMedia } from '../../domain/enums/media.enum';
import {
  ArchivoVacioError,
  EmpresaRequeridaError,
} from '../../domain/errors/almacenamiento-media.errors';
import { detectarTipoArchivo } from '../../domain/policies/tipo-archivo.policy';
import {
  MEDIA_REPOSITORY,
  MediaRepositoryPort,
} from '../../domain/ports/media-repository.port';
import {
  SubirMediaInput,
  SubirMediaResult,
} from '../../public/almacenamiento-media.facade.port';
import {
  ALMACENAMIENTO_MEDIA_CONFIG,
  AlmacenamientoMediaConfig,
} from '../ports/almacenamiento-media-config.port';
import { FILE_STORAGE, FileStoragePort } from '../ports/file-storage.port';
import { MediaKeyService } from '../services/media-key.service';

/** Sube un archivo y lo registra en la tabla `Media`. */
@Injectable()
export class SubirMediaUseCase {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    @Inject(MEDIA_REPOSITORY) private readonly repo: MediaRepositoryPort,
    @Inject(ALMACENAMIENTO_MEDIA_CONFIG)
    private readonly config: AlmacenamientoMediaConfig,
    @Inject(RELOJ) private readonly reloj: RelojPort,
    private readonly keys: MediaKeyService,
  ) {}

  async execute(input: SubirMediaInput): Promise<SubirMediaResult> {
    if (!input.empresaId) throw new EmpresaRequeridaError();
    if (!input.buffer?.length) throw new ArchivoVacioError();

    const detectado = detectarTipoArchivo({
      bytes: input.buffer,
      mimeDeclarado: input.mime,
      tipoDeclarado: input.tipo,
    });

    const extension = this.keys.inferirExtension(
      detectado.mime,
      input.fileName,
    );
    const ahora = this.reloj.ahora();

    const key = this.keys.generarKey({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      albumId: input.albumId,
      tipo: detectado.tipo,
      extension,
      basePrefix: input.basePrefix ?? this.config.basePrefixPorDefecto,
      subfolder: input.subfolder,
      fecha: ahora,
    });

    const subido = await this.storage.upload({
      bucket: this.config.bucket,
      key,
      body: input.buffer,
      contentType: detectado.mime,
      cacheControl: 'public, max-age=31536000, immutable',
      acl: 'public-read',
    });

    const guardado = await this.repo.guardar({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      albumId: input.albumId,
      subidoPorId: input.subidoPorId,
      provider: this.config.provider,
      bucket: subido.bucket,
      key: subido.key,
      cdnUrl: subido.cdnUrl ?? `${this.config.cdnBase}/${subido.key}`,
      mimeType: detectado.mime,
      extension: extension.replace('.', ''),
      tamanioBytes: subido.size,
      categoria: input.categoria,
      tipo: detectado.tipo,
      publico: input.publico,
      estado: EstadoMedia.LISTO,
      titulo: input.titulo,
      descripcion: input.descripcion,
      etiqueta: input.etiqueta,
      creadoEn: ahora,
    });

    return {
      id: guardado.id!,
      cdnUrl: guardado.cdnUrl,
      bucket: guardado.bucket,
      key: guardado.key,
      tipo: guardado.tipo,
    };
  }
}
