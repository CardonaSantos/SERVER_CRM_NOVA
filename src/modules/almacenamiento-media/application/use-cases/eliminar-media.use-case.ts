import { Inject, Injectable } from '@nestjs/common';

import {
  EmpresaRequeridaError,
  MediaNoEncontradaError,
} from '../../domain/errors/almacenamiento-media.errors';
import {
  MEDIA_REPOSITORY,
  MediaRepositoryPort,
} from '../../domain/ports/media-repository.port';
import {
  EliminarMediaInput,
  EliminarMediaResult,
} from '../../public/almacenamiento-media.facade.port';
import { FILE_STORAGE, FileStoragePort } from '../ports/file-storage.port';

/**
 * Borra el archivo del almacenamiento y su fila en `Media`.
 *
 * Antes existía un "borrado suave" (marcar ELIMINADO) que nadie usaba y que
 * fallaba: EstadoMedia no tiene ese valor. Todos los llamadores pedían
 * borrado real, que es lo único que queda.
 */
@Injectable()
export class EliminarMediaUseCase {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
    @Inject(MEDIA_REPOSITORY) private readonly repo: MediaRepositoryPort,
  ) {}

  async execute(input: EliminarMediaInput): Promise<EliminarMediaResult> {
    if (!input.empresaId) throw new EmpresaRequeridaError();

    const media = await this.repo.buscarPorId(input.id, input.empresaId);

    if (!media) throw new MediaNoEncontradaError();

    if (media.key) {
      await this.storage.delete({
        bucket: media.bucket ?? undefined,
        key: media.key,
      });
    }

    await this.repo.eliminar(input.id);

    return { id: input.id, eliminado: true };
  }
}
