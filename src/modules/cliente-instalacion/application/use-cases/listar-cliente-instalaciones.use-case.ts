import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoInstalacionCliente } from '../../domain/enums/estado-instalacion-cliente.enum';
import { TipoInstalacionCliente } from '../../domain/enums/tipo-instalacion-cliente.enum';
import {
  CLIENTE_INSTALACION_QUERY,
  ClienteInstalacionQueryPort,
} from '../../domain/ports/cliente-instalacion-query.port';
import { ClienteInstalacionListItem } from '../../domain/read-models/cliente-instalacion-listado.read-model';

export type ListarClienteInstalacionesInput = {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: number;
  servicioInternetId?: number;
  ticketId?: number;
  asesorId?: number;
  creadoPorId?: number;
  completadoPorId?: number;
  estado?: EstadoInstalacionCliente;
  tipo?: TipoInstalacionCliente;
  fechaProgramadaDesde?: string;
  fechaProgramadaHasta?: string;
  fechaFinalizacionDesde?: string;
  fechaFinalizacionHasta?: string;
};

@Injectable()
export class ListarClienteInstalacionesUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_QUERY)
    private readonly consultas: ClienteInstalacionQueryPort,
  ) {}

  execute(
    input: ListarClienteInstalacionesInput,
  ): Promise<ResultadoPaginado<ClienteInstalacionListItem>> {
    const fecha = (valor?: string) => (valor ? new Date(valor) : null);

    return this.consultas.findMany(
      {
        search: input.search ?? null,
        clienteId: input.clienteId ?? null,
        servicioInternetId: input.servicioInternetId ?? null,
        ticketId: input.ticketId ?? null,
        asesorId: input.asesorId ?? null,
        creadoPorId: input.creadoPorId ?? null,
        completadoPorId: input.completadoPorId ?? null,
        estado: input.estado ?? null,
        tipo: input.tipo ?? null,
        fechaProgramadaDesde: fecha(input.fechaProgramadaDesde),
        fechaProgramadaHasta: fecha(input.fechaProgramadaHasta),
        fechaFinalizacionDesde: fecha(input.fechaFinalizacionDesde),
        fechaFinalizacionHasta: fecha(input.fechaFinalizacionHasta),
      },
      normalizarPaginacion(input),
    );
  }
}
