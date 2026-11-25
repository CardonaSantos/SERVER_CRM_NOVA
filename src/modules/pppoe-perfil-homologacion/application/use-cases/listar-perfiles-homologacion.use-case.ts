import { Inject, Injectable } from '@nestjs/common';

import {
  ResultadoPaginado,
  normalizarPaginacion,
} from 'src/common/hexagonal/paginacion';

import {
  PERFIL_HOMOLOGACION_QUERY,
  PerfilHomologacionQueryPort,
} from '../../domain/ports/perfil-homologacion-query.port';
import { PerfilHomologacionListItem } from '../../domain/read-models/perfil-homologacion.read-model';

export type ListarPerfilesHomologacionInput = {
  page?: number;
  limit?: number;
  search?: string;
  activo?: boolean;
  mikrotikRouterId?: number;
  servicioInternetId?: number;
};

@Injectable()
export class ListarPerfilesHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_QUERY)
    private readonly consulta: PerfilHomologacionQueryPort,
  ) {}

  execute(
    input: ListarPerfilesHomologacionInput,
  ): Promise<ResultadoPaginado<PerfilHomologacionListItem>> {
    return this.consulta.findMany(
      {
        search: input.search?.trim() || null,
        activo: typeof input.activo === 'boolean' ? input.activo : null,
        mikrotikRouterId: input.mikrotikRouterId ?? null,
        servicioInternetId: input.servicioInternetId ?? null,
      },
      normalizarPaginacion(input),
    );
  }
}
