// src/modules/media/application/use-cases/eliminar-media.usecase.ts

import { FileStoragePort } from '../../domain/ports/file-storage.port';
import { MediaRepositoryPort } from '../../domain/ports/media-repository.port';
import {
  EliminarMediaCommand,
  EliminarMediaResult,
} from '../../dto/eliminar-media.dto';

export class EliminarMediaUseCase {
  constructor(
    private readonly storage: FileStoragePort,
    private readonly repo: MediaRepositoryPort,
  ) {}

  async execute(cmd: EliminarMediaCommand): Promise<EliminarMediaResult> {
    if (!cmd.empresaId) throw new Error('empresaId requerido');
    if (!cmd.id) throw new Error('id de media requerido');

    // 1) Buscar registro
    const media = await this.repo.buscarPorId(cmd.id, cmd.empresaId);
    if (!media) {
      throw new Error('Media no encontrada para este empresaId');
    }

    if (media.key) {
      await this.storage.delete({
        bucket: media.bucket ?? undefined,
        key: media.key,
      });
    }

    if (cmd.hardDelete) {
      // borrado real
      await this.repo.eliminar(cmd.id, cmd.empresaId);
    } else {
      // soft delete (marca como ELIMINADO)
      await this.repo.marcarEliminado(cmd.id, cmd.empresaId, new Date());
    }

    return {
      id: cmd.id,
      eliminado: true,
    };
  }
}
