import { TicketFirmaEntity } from '../entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';

export const TICKET_FIRMA_REPOSITORY = Symbol('TICKET_FIRMA_REPOSITORY');

/** Las firmas son evidencia histórica: el puerto no actualiza ni borra. */
export interface TicketFirmaRepositoryPort {
  /**
   * Guarda la firma. Si otra petición ya guardó la del mismo tipo para la
   * conformidad (única por conformidad y tipo), lanza `TicketFirmaDuplicadaError`.
   */
  create(entity: TicketFirmaEntity): Promise<TicketFirmaEntity>;

  existsByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<boolean>;
}
