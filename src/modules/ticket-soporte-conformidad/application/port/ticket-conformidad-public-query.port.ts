import { TicketConformidadPublicReadModel } from '../models/ticket-conformidad-public.read-model';

export const TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT = Symbol(
  'TICKET_CONFORMIDAD_PUBLIC_QUERY_PORT',
);

export interface TicketConformidadPublicQueryPort {
  findByConformidadId(
    conformidadId: number,
    expiraEn: Date,
  ): Promise<TicketConformidadPublicReadModel | null>;
}
