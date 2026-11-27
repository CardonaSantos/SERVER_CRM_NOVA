import { SolucionTicketEntity } from '../entities/solucion-ticket.entity';

export const SOLUCION_TICKET_REPOSITORY = Symbol('SOLUCION_TICKET_REPOSITORY');

export interface SolucionTicketRepositoryPort {
  /** Hace esperar a quien quiera cambiar nombres hasta el fin de la unidad. */
  bloquearNombres(): Promise<void>;

  /** Por nombre sin distinguir mayúsculas; incluye las eliminadas. */
  findByNombre(nombre: string): Promise<SolucionTicketEntity | null>;

  findById(id: number): Promise<SolucionTicketEntity | null>;

  create(solucion: SolucionTicketEntity): Promise<SolucionTicketEntity>;

  update(solucion: SolucionTicketEntity): Promise<SolucionTicketEntity>;
}
