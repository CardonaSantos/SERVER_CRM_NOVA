import { TicketConformidadEntity } from '../entities/ticket-conformidad.entity';
import { TicketConformidadResultado } from '../enums/ticket-conformidad-resultado.enum';

export const TICKET_CONFORMIDAD_REPOSITORY = Symbol(
  'TICKET_CONFORMIDAD_REPOSITORY',
);

export interface TicketConformidadRepositoryPort {
  /**
   * Persiste un nuevo ciclo de conformidad.
   */
  create(entity: TicketConformidadEntity): Promise<TicketConformidadEntity>;

  /**
   * Persiste cambios de comportamiento de una conformidad existente.
   *
   * Principalmente:
   * - resultado
   * - respondidoEn
   * - actualizadoEn
   */
  update(entity: TicketConformidadEntity): Promise<TicketConformidadEntity>;

  /**
   * Busca una conformidad concreta por PK.
   */
  findById(id: number): Promise<TicketConformidadEntity | null>;

  /**
   * Obtiene el ciclo de conformidad más reciente de un ticket.
   *
   * Debe ordenar por creadoEn DESC y utilizar id DESC
   * como desempate estable.
   */
  findLatestByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null>;

  /**
   * Obtiene el historial completo de conformidades
   * correspondientes al ticket.
   *
   * Conviene devolverlo de más antiguo a más reciente.
   */
  findAllByTicketId(ticketId: number): Promise<TicketConformidadEntity[]>;

  /**
   * Busca una conformidad actualmente pendiente.
   *
   * Sirve para evitar abrir simultáneamente varios ciclos
   * PENDIENTE para el mismo ticket.
   */
  findPendingByTicketId(
    ticketId: number,
  ): Promise<TicketConformidadEntity | null>;

  /**
   * Consulta económica para comprobar existencia.
   */
  existsById(id: number): Promise<boolean>;

  /**
   * Permite responder preguntas de dominio como:
   *
   * - ¿este ticket ya tuvo algún retrabajo?
   * - ¿alguna conformidad llegó a CONFORME?
   */
  existsByTicketAndResultado(
    ticketId: number,
    resultado: TicketConformidadResultado,
  ): Promise<boolean>;
}
