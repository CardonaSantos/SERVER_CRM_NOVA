import { Inject, Injectable } from '@nestjs/common';

import { AutorizacionesPendientesPaginatedResult, ClienteDesinstalacionAutorizacionRepositoryPort, CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from '../../domain/ports/cliente-desinstalacion-autorizacion-repository.port';


import { FiltrarAutorizacionesPendientesDto } from '../../presentation/dto/listar-autorizaciones-pendientes-query.dto';

@Injectable()
export class ListarAutorizacionesPendientesUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY)
    private readonly autorizacionRepository: ClienteDesinstalacionAutorizacionRepositoryPort,
  ) {}

  async execute(
    filters: FiltrarAutorizacionesPendientesDto,
  ): Promise<AutorizacionesPendientesPaginatedResult> {
    return this.autorizacionRepository.findPendientes({
      page: filters.page,

      limit: filters.limit,
    });
  }
}
