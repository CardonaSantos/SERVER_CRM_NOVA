import { TicketFirmaEntity } from '../entities/ticket-firma.entity';
import { TicketFirmaTipo } from '../enums/ticket-firma-tipo.enum';

export const TICKET_FIRMA_REPOSITORY = Symbol('TICKET_FIRMA_REPOSITORY');

export interface TicketFirmaRepositoryPort {
  /**
   * Registra una nueva firma.
   *
   * Las firmas se consideran evidencia histórica,
   * por lo que no exponemos update genérico.
   */
  create(entity: TicketFirmaEntity): Promise<TicketFirmaEntity>;

  /**
   * Obtiene una firma por PK.
   */
  findById(id: number): Promise<TicketFirmaEntity | null>;

  /**
   * Obtiene la firma CLIENTE o TECNICO de una conformidad.
   *
   * La restricción UNIQUE(conformidadId, tipo)
   * garantiza como máximo una coincidencia.
   */
  findByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<TicketFirmaEntity | null>;

  /**
   * Obtiene todas las firmas asociadas al ciclo.
   *
   * Normalmente tendrá:
   * - CLIENTE
   * - TECNICO
   */
  findAllByConformidadId(conformidadId: number): Promise<TicketFirmaEntity[]>;

  /**
   * Consulta económica para validar si determinada
   * firma ya fue registrada.
   */
  existsByConformidadAndTipo(
    conformidadId: number,
    tipo: TicketFirmaTipo,
  ): Promise<boolean>;
}
