import { Inject, Injectable } from '@nestjs/common';

import {
  ClienteDesInstalacionPaginatedResult,
  ClienteDesInstalacionRepositoryPort,
} from '../../domain/ports/cliente-desinstalacion.repository.port';

import { CLIENTE_DESINSTALACION_REPOSITORY } from '../../infra/tokens/cliente-desinstalacion.token';

import { FiltrarClienteDesinstalacionesDto } from '../dto/filtrar-cliente-desinstalaciones.dto';

@Injectable()
export class ListarClienteDesinstalacionesUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_REPOSITORY)
    private readonly clienteDesinstalacionRepository: ClienteDesInstalacionRepositoryPort,
  ) {}

  async execute(
    filters: FiltrarClienteDesinstalacionesDto,
  ): Promise<ClienteDesInstalacionPaginatedResult> {
    return this.clienteDesinstalacionRepository.findMany({
      page: filters.page ?? 1,
      limit: filters.limit ?? 10,

      empresaId: filters.empresaId ?? null,
      clienteId: filters.clienteId ?? null,

      servicioInternetId: filters.servicioInternetId ?? null,
      ticketId: filters.ticketId ?? null,

      solicitadoPorId: filters.solicitadoPorId ?? null,
      ejecutadoPorId: filters.ejecutadoPorId ?? null,
      creadoPorId: filters.creadoPorId ?? null,

      accesoInternetId: filters.accesoInternetId ?? null,

      estado: filters.estado ?? null,
      tipo: filters.tipo ?? null,
      motivo: filters.motivo ?? null,

      fechaProgramadaDesde: filters.fechaProgramadaDesde
        ? new Date(filters.fechaProgramadaDesde)
        : null,

      fechaProgramadaHasta: filters.fechaProgramadaHasta
        ? new Date(filters.fechaProgramadaHasta)
        : null,

      fechaFinalizacionDesde: filters.fechaFinalizacionDesde
        ? new Date(filters.fechaFinalizacionDesde)
        : null,

      fechaFinalizacionHasta: filters.fechaFinalizacionHasta
        ? new Date(filters.fechaFinalizacionHasta)
        : null,

      search: filters.search ?? null,
    });
  }
}
