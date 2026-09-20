import { Inject, Injectable } from '@nestjs/common';

import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';

import {
  ClienteInstalacionAssignedPaginatedResult,
  ClienteInstalacionRepositoryPort,
} from '../../domain/ports/cliente-instalacion.repository.port';

import { CLIENTE_INSTALACION_REPOSITORY } from '../../infra/tokens/cliente-instalacion.tokens';

export type ListarMisInstalacionesAsignadasInput = {
  /**
   * Identificador del técnico autenticado.
   * Debe provenir exclusivamente del JWT.
   */
  tecnicoId: number;

  page?: number;
  limit?: number;

  search?: string | null;

  estado?: EstadoInstalacionCliente | null;

  fechaProgramadaDesde?: Date | null;
  fechaProgramadaHasta?: Date | null;
};

@Injectable()
export class ListarMisInstalacionesAsignadasUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  execute(
    input: ListarMisInstalacionesAsignadasInput,
  ): Promise<ClienteInstalacionAssignedPaginatedResult> {
    return this.instalacionRepository.findAssignedToTechnician({
      tecnicoId: input.tecnicoId,

      page: input.page ?? 1,
      limit: input.limit ?? 10,

      search: input.search?.trim() || null,

      estado: input.estado ?? null,

      fechaProgramadaDesde: input.fechaProgramadaDesde ?? null,

      fechaProgramadaHasta: input.fechaProgramadaHasta ?? null,
    });
  }
}
