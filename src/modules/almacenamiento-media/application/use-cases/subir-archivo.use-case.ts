import { Inject, Injectable } from '@nestjs/common';

import { RELOJ, RelojPort } from 'src/common/reloj/reloj.port';

import {
  ArchivoVacioError,
  TipoArchivoNoReconocidoError,
} from '../../domain/errors/almacenamiento-media.errors';
import {
  SubirArchivoInput,
  SubirArchivoResult,
} from '../../public/almacenamiento-media.facade.port';
import {
  ALMACENAMIENTO_MEDIA_CONFIG,
  AlmacenamientoMediaConfig,
} from '../ports/almacenamiento-media-config.port';
import { FILE_STORAGE, FileStoragePort } from '../ports/file-storage.port';
import { MediaKeyService } from '../services/media-key.service';

/**
 * Sube un archivo al almacenamiento sin registrarlo en `Media` (avatares,
 * expedientes de crédito: el llamador guarda bucket/key en su propia tabla).
 */
@Injectable()
export class SubirArchivoUseCase {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    @Inject(ALMACENAMIENTO_MEDIA_CONFIG)
    private readonly config: AlmacenamientoMediaConfig,
    @Inject(RELOJ) private readonly reloj: RelojPort,
    private readonly keys: MediaKeyService,
  ) {}

  async execute(input: SubirArchivoInput): Promise<SubirArchivoResult> {
    if (!input.buffer?.length) throw new ArchivoVacioError();
    if (!input.mime?.includes('/')) throw new TipoArchivoNoReconocidoError();

    const extension = this.keys.inferirExtension(input.mime, input.fileName);

    const key = this.keys.generarKey({
      empresaId: input.empresaId,
      clienteId: input.clienteId,
      tipo: input.tipo,
      extension,
      basePrefix: input.basePrefix ?? 'crm',
      fecha: this.reloj.ahora(),
    });

    const subido = await this.storage.upload({
      bucket: this.config.bucket,
      key,
      body: input.buffer,
      contentType: input.mime,
      cacheControl: 'public, max-age=31536000, immutable',
      acl: 'public-read',
    });

    return {
      provider: this.config.provider,
      bucket: subido.bucket,
      key: subido.key,
      cdnUrl: subido.cdnUrl ?? `${this.config.cdnBase}/${subido.key}`,
      mimeType: input.mime,
      extension: extension.replace('.', ''),
      size: subido.size,
    };
  }
}
