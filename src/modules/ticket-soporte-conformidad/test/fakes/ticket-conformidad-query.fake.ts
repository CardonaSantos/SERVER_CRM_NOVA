import { TicketConformidadQueryPort } from '../../domain/ports/ticket-conformidad-query.port';
import {
  TicketConformidadDetalleReadModel,
  TicketConformidadHistorialReadModel,
} from '../../domain/read-models/ticket-soporte-conformidad.read-model';

export class TicketConformidadQueryFake implements TicketConformidadQueryPort {
  detalle: TicketConformidadDetalleReadModel | null = null;
  historial: TicketConformidadHistorialReadModel | null = null;

  findDetalleById(): Promise<TicketConformidadDetalleReadModel | null> {
    return Promise.resolve(this.detalle);
  }

  findLatestDetalleByTicketId(): Promise<TicketConformidadDetalleReadModel | null> {
    return Promise.resolve(this.detalle);
  }

  findHistorialByTicketId(): Promise<TicketConformidadHistorialReadModel | null> {
    return Promise.resolve(this.historial);
  }
}
