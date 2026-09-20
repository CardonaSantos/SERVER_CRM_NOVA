import { Inject, Injectable } from '@nestjs/common';

import { PerfilHomologacionRepositoryPort } from '../../domain/ports/ppoe-perfil-homologacion.port';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from '../../infra/tokens/ppoe-perfil-homologacion.token';
import { PerfilHomologacionSeleccionable } from '../../domain/models/pppoe-perfil-homologacion.read-model';
import { ListarPerfilesHomologacionSeleccionablesQuery } from '../dto/homologacion-query';

@Injectable()
export class ListarPerfilesHomologacionSeleccionablesUseCase {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
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
