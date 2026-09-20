import { Inject, Injectable } from '@nestjs/common';

import {
  AutorizacionesPendientesPaginatedResult,
  ClienteDesinstalacionAutorizacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion-autorizacion.repository.port';

import { CLIENTE_DESINSTALACION_AUTORIZACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

import { FiltrarAutorizacionesPendientesDto } from '../dto/filtrar-autorizaciones-pendientes.dto';

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
