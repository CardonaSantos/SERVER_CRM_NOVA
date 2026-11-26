import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import {
  CLIENTE_INSTALACION_QUERY,
  ClienteInstalacionQueryPort,
} from '../../domain/ports/cliente-instalacion-query.port';
import { ClienteInstalacionAssignedListItem } from '../../domain/read-models/cliente-instalacion-listado.read-model';

export type ListarMisInstalacionesAsignadasInput = {
  /** El técnico autenticado; nunca viene de la petición. */
  tecnicoId: number;
  page?: number;
  limit?: number;
  search?: string;
  estado?: EstadoInstalacionCliente;
  fechaProgramadaDesde?: string;
  fechaProgramadaHasta?: string;
};

@Injectable()
export class ListarMisInstalacionesAsignadasUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_QUERY)
    private readonly consultas: ClienteInstalacionQueryPort,
  ) {}

  execute(
    input: ListarMisInstalacionesAsignadasInput,
  ): Promise<ResultadoPaginado<ClienteInstalacionAssignedListItem>> {
    return this.consultas.findAsignadasAlTecnico(
      {
        tecnicoId: input.tecnicoId,
        search: input.search?.trim() || null,
        estado: input.estado ?? null,
        fechaProgramadaDesde: input.fechaProgramadaDesde
          ? new Date(input.fechaProgramadaDesde)
          : null,
        fechaProgramadaHasta: input.fechaProgramadaHasta
          ? new Date(input.fechaProgramadaHasta)
          : null,
      },
      normalizarPaginacion(input),
    );
  }
}
