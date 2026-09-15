import { TicketSoporteHistorialEntity } from '../domain/entities/ticket-soporte-historial.entity';
import { TicketSoporteHistorialPaginatedResult } from '../domain/read-models/ticket-soporte-historial-list.read-model';

export class TicketSoporteHistorialPresenter {
  static toHttp(entity: TicketSoporteHistorialEntity) {
    return {
      id: entity.id,
      ticketId: entity.ticketId,
      tipo: entity.tipo,
      descripcion: entity.descripcion,
      actor: {
        usuarioId: entity.usuarioId,
        nombre: entity.usuarioNombre ?? 'Sistema',
      },
      creadoEn: entity.creadoEn.toISOString(),
    };
  }

  static paginatedToHttp(result: TicketSoporteHistorialPaginatedResult) {
    return {
      data: result.data.map((entity) => this.toHttp(entity)),
      meta: result.meta,
    };
  }
}
