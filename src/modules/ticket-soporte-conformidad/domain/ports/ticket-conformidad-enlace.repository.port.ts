import { TicketConformidadEnlaceEntity } from '../entities/ticket-conformidad-enlace.entity';

export const TICKET_CONFORMIDAD_ENLACE_REPOSITORY = Symbol(
  'TICKET_CONFORMIDAD_ENLACE_REPOSITORY',
);

export interface TicketConformidadEnlaceRepositoryPort {
  /**
   * Registra un nuevo enlace temporal.
   */
  create(
    entity: TicketConformidadEnlaceEntity,
  ): Promise<TicketConformidadEnlaceEntity>;

  /**
   * Persiste cambios de comportamiento:
   *
   * - usadoEn
   * - revocadoEn
   */
  update(
    entity: TicketConformidadEnlaceEntity,
  ): Promise<TicketConformidadEnlaceEntity>;

  /**
   * Obtiene un enlace por PK.
   */
  findById(id: number): Promise<TicketConformidadEnlaceEntity | null>;

  /**
   * Busca el enlace utilizando únicamente el HASH
   * derivado del token público recibido.
   *
   * Nunca debe buscarse utilizando un token plano persistido.
   */
  findByTokenHash(
    tokenHash: string,
  ): Promise<TicketConformidadEnlaceEntity | null>;

  /**
   * Obtiene todos los enlaces generados para una conformidad.
   *
   * Resulta útil para historial/auditoría interna.
   */
  findAllByConformidadId(
    conformidadId: number,
  ): Promise<TicketConformidadEnlaceEntity[]>;

  /**
   * Obtiene los enlaces todavía utilizables.
   *
   * La implementación deberá considerar:
   *
   * usadoEn      = null
   * revocadoEn   = null
   * expiraEn     > fecha
   */
  findActiveByConformidadId(
    conformidadId: number,
    fecha: Date,
  ): Promise<TicketConformidadEnlaceEntity[]>;

  /**
   * Consulta económica para comprobar una colisión
   * extremadamente improbable del hash generado.
   */
  existsByTokenHash(tokenHash: string): Promise<boolean>;
}
