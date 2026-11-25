import { Inject, Injectable } from '@nestjs/common';

import { EliminarArchivoInput } from '../../public/almacenamiento-media.facade.port';
import { FILE_STORAGE, FileStoragePort } from '../ports/file-storage.port';

/** Borra un archivo del almacenamiento que no tiene fila en `Media`. */
@Injectable()
export class EliminarArchivoUseCase {
  constructor(
    @Inject(FILE_STORAGE) private readonly storage: FileStoragePort,
  ) {}

  async execute(input: EliminarArchivoInput): Promise<void> {
    await this.storage.delete({ bucket: input.bucket, key: input.key });
  }
}
