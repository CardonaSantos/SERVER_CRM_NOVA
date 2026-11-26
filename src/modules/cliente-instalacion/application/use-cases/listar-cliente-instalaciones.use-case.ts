import { Inject, Injectable } from '@nestjs/common';
import { CLIENTE_INSTALACION_REPOSITORY, ClienteInstalacionPaginatedResult, ClienteInstalacionRepositoryPort } from '../../domain/ports/cliente-instalacion-repository.port';
import { FiltrarClienteInstalacionesDto } from '../../presentation/dto/listar-cliente-instalaciones-query.dto';

@Injectable()
export class ListarClienteInstalacionesUseCase {
  constructor(
    @Inject(CLIENTE_INSTALACION_REPOSITORY)
    private readonly instalacionRepository: ClienteInstalacionRepositoryPort,
  ) {}

  async execute(
    filters: FiltrarClienteInstalacionesDto,
  ): Promise<ClienteInstalacionPaginatedResult> {
    return this.instalacionRepository.findMany({
      empresaId: filters.empresaId,

      page: filters.page ?? 1,
      limit: filters.limit ?? 10,

      search: filters.search ?? null,

      clienteId: filters.clienteId ?? null,
      servicioInternetId: filters.servicioInternetId ?? null,
      ticketId: filters.ticketId ?? null,
      asesorId: filters.asesorId ?? null,
      creadoPorId: filters.creadoPorId ?? null,
      completadoPorId: filters.completadoPorId ?? null,

      estado: filters.estado ?? null,
      tipo: filters.tipo ?? null,

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
    });
  }
}
