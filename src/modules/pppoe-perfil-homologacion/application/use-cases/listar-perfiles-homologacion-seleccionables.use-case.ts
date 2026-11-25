import { Inject, Injectable } from '@nestjs/common';

import {
  PerfilHomologacionRepositoryPort,
  PERFIL_HOMOLOGACION_REPOSITORY,
} from '../../domain/ports/perfil-homologacion-repository.port';
import { PerfilHomologacionSeleccionable } from '../../domain/read-models/perfil-homologacion.read-model';
import { ListarPerfilesHomologacionSeleccionablesQuery } from '../../presentation/dto/listar-perfiles-homologacion-seleccionables-query.dto';

@Injectable()
export class ListarPerfilesHomologacionSeleccionablesUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  execute(
    query: ListarPerfilesHomologacionSeleccionablesQuery,
  ): Promise<PerfilHomologacionSeleccionable[]> {
    return this.perfilRepository.findSeleccionables({
      //   empresaId: query.empresaId,
      search: query.search?.trim() || null,
    });
  }
}
