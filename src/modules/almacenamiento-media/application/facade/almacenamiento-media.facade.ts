import { Injectable } from '@nestjs/common';

import {
  AlmacenamientoMediaFacadePort,
  EliminarArchivoInput,
  EliminarMediaInput,
  EliminarMediaResult,
  SubirArchivoInput,
  SubirArchivoResult,
  SubirMediaInput,
  SubirMediaResult,
} from '../../public/almacenamiento-media.facade.port';
import { EliminarArchivoUseCase } from '../use-cases/eliminar-archivo.use-case';
import { EliminarMediaUseCase } from '../use-cases/eliminar-media.use-case';
import { SubirArchivoUseCase } from '../use-cases/subir-archivo.use-case';
import { SubirMediaUseCase } from '../use-cases/subir-media.use-case';

/** Implementa la API pública delegando en los casos de uso. */
@Injectable()
export class AlmacenamientoMediaFacade
  implements AlmacenamientoMediaFacadePort
{
  constructor(
    private readonly subirMediaUseCase: SubirMediaUseCase,
    private readonly subirArchivoUseCase: SubirArchivoUseCase,
    private readonly eliminarMediaUseCase: EliminarMediaUseCase,
    private readonly eliminarArchivoUseCase: EliminarArchivoUseCase,
  ) {}

  subirMedia(input: SubirMediaInput): Promise<SubirMediaResult> {
    return this.subirMediaUseCase.execute(input);
  }

  subirArchivo(input: SubirArchivoInput): Promise<SubirArchivoResult> {
    return this.subirArchivoUseCase.execute(input);
  }

  eliminarMedia(input: EliminarMediaInput): Promise<EliminarMediaResult> {
    return this.eliminarMediaUseCase.execute(input);
  }

  eliminarArchivo(input: EliminarArchivoInput): Promise<void> {
    return this.eliminarArchivoUseCase.execute(input);
  }
}
