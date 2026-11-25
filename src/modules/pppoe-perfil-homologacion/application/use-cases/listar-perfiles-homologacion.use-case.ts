import { Inject, Injectable } from '@nestjs/common';
import {
  PerfilHomologacionRepositoryPort,
  PERFIL_HOMOLOGACION_REPOSITORY,
} from '../../domain/ports/perfil-homologacion-repository.port';
import { ListarPpoePerfilesHomologacionQueryDto } from '../../presentation/dto/listar-perfiles-homologacion-query.dto';
import { PerfilHomologacionPaginatedResult } from '../../domain/read-models/perfil-homologacion.read-model';

@Injectable()
export class ListarPerfilesHomologacionUseCase {
  constructor(
    @Inject(PERFIL_HOMOLOGACION_REPOSITORY)
    private readonly perfilRepository: PerfilHomologacionRepositoryPort,
  ) {}

  execute(
    query: ListarPpoePerfilesHomologacionQueryDto,
  ): Promise<PerfilHomologacionPaginatedResult> {
    return this.perfilRepository.findMany({
      page: query.page ?? 1,

      limit: query.limit ?? 10,

      search: query.search?.trim() || null,

      activo: typeof query.activo === 'boolean' ? query.activo : null,

      mikrotikRouterId: query.mikrotikRouterId ?? null,

      servicioInternetId: query.servicioInternetId ?? null,
    });
  }
}
