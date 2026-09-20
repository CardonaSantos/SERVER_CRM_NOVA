import { Inject, Injectable } from '@nestjs/common';
import {
  TICKET_SOPORTE_HISTORIAL_REPOSITORY,
  TicketSoporteHistorialRepositoryPort,
} from '../../domain/ports/ticket-soporte-historial-repository.port';
import { TicketSoporteHistorialPaginatedResult } from '../../domain/read-models/ticket-soporte-historial-list.read-model';
import { ListarTicketSoporteHistorialQueryDto } from '../dto/listar-ticket-soporte-historial-query.dto';

@Injectable()
export class ListarTicketSoporteHistorialUseCase {
  constructor(
    @Inject(TICKET_SOPORTE_HISTORIAL_REPOSITORY)
    private readonly repository: TicketSoporteHistorialRepositoryPort,
  ) {}

  execute(
    query: ListarTicketSoporteHistorialQueryDto,
  ): Promise<TicketSoporteHistorialPaginatedResult> {
    return this.repository.findPaginated({
      page: query.page,
      limit: query.limit,
      ticketId: query.ticketId,
      usuarioId: query.usuarioId,
      tipo: query.tipo,
      search: query.search?.trim() || null,
      fechaDesde: query.fechaDesde ? new Date(query.fechaDesde) : null,
      fechaHasta: query.fechaHasta ? new Date(query.fechaHasta) : null,
      ordenDireccion: query.ordenDireccion,
    });
  }
}
