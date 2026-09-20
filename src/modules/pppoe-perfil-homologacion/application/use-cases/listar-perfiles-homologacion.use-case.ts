import { Inject, Injectable } from '@nestjs/common';
import { PerfilHomologacionRepositoryPort } from '../../domain/ports/ppoe-perfil-homologacion.port';
import { PPPOE_PERFIL_HOMOLOGACION_REPOSITORY } from '../../infra/tokens/ppoe-perfil-homologacion.token';
import { ListarPpoePerfilesHomologacionQueryDto } from '../dto/listar-ppoe-perfiles-homologacion-query.dto';
import { PerfilHomologacionPaginatedResult } from '../../domain/models/pppoe-perfil-homologacion.read-model';

@Injectable()
export class ListarPerfilesHomologacionUseCase {
  constructor(
    @Inject(PPPOE_PERFIL_HOMOLOGACION_REPOSITORY)
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
