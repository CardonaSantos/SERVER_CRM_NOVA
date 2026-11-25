import { Inject, Injectable } from '@nestjs/common';

import {
  PERFIL_HOMOLOGACION_QUERY,
  PerfilHomologacionQueryPort,
} from '../../domain/ports/perfil-homologacion-query.port';
import { PerfilHomologacionSeleccionable } from '../../domain/read-models/perfil-homologacion.read-model';

export type ListarPerfilesHomologacionSeleccionablesInput = {
  search?: string;
};

@Injectable()
export class ListarPerfilesHomologacionSeleccionablesUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_QUERY)
    private readonly consulta: PerfilHomologacionQueryPort,
  ) {}

  execute(
    input: ListarPerfilesHomologacionSeleccionablesInput,
  ): Promise<PerfilHomologacionSeleccionable[]> {
    return this.consulta.findSeleccionables(input.search?.trim() || null);
  }
}
