import { Inject, Injectable } from '@nestjs/common';
import {
  normalizarPaginacion,
  ResultadoPaginado,
} from 'src/common/hexagonal/paginacion';
import { EstadoDesinstalacionCliente } from '../../domain/enums/estado-desinstalacion-cliente.enum';
import { MotivoDesinstalacionCliente } from '../../domain/enums/motivo-desinstalacion-cliente.enum';
import { TipoDesinstalacionCliente } from '../../domain/enums/tipo-desinstalacion-cliente.enum';
import {
  CLIENTE_DESINSTALACION_QUERY,
  ClienteDesinstalacionQueryPort,
} from '../../domain/ports/cliente-desinstalacion-query.port';
import { ClienteDesinstalacionListadoItem } from '../../domain/read-models/cliente-desinstalacion.read-model';

export type ListarClienteDesinstalacionesInput = {
  page?: number;
  limit?: number;
  search?: string;
  clienteId?: number;
  servicioInternetId?: number;
  ticketId?: number;
  accesoInternetId?: number;
  solicitadoPorId?: number;
  ejecutadoPorId?: number;
  creadoPorId?: number;
  estado?: EstadoDesinstalacionCliente;
  tipo?: TipoDesinstalacionCliente;
  motivo?: MotivoDesinstalacionCliente;
  fechaProgramadaDesde?: string;
  fechaProgramadaHasta?: string;
  fechaFinalizacionDesde?: string;
  fechaFinalizacionHasta?: string;
};

@Injectable()
export class ListarClienteDesinstalacionesUseCase {
  constructor(
    @Inject(CLIENTE_DESINSTALACION_QUERY)
    private readonly consultas: ClienteDesinstalacionQueryPort,
  ) {}

  execute(
    input: ListarClienteDesinstalacionesInput,
  ): Promise<ResultadoPaginado<ClienteDesinstalacionListadoItem>> {
    const fecha = (valor?: string) => (valor ? new Date(valor) : null);

    return this.consultas.findMany(
      {
        search: input.search ?? null,
        clienteId: input.clienteId ?? null,
        servicioInternetId: input.servicioInternetId ?? null,
        ticketId: input.ticketId ?? null,
        accesoInternetId: input.accesoInternetId ?? null,
        solicitadoPorId: input.solicitadoPorId ?? null,
        ejecutadoPorId: input.ejecutadoPorId ?? null,
        creadoPorId: input.creadoPorId ?? null,
        estado: input.estado ?? null,
        tipo: input.tipo ?? null,
        motivo: input.motivo ?? null,
        fechaProgramadaDesde: fecha(input.fechaProgramadaDesde),
        fechaProgramadaHasta: fecha(input.fechaProgramadaHasta),
        fechaFinalizacionDesde: fecha(input.fechaFinalizacionDesde),
        fechaFinalizacionHasta: fecha(input.fechaFinalizacionHasta),
      },
      normalizarPaginacion(input),
    );
  }
}
