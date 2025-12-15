import { TicketResumen } from '../entities/ticket-resuman.entity';

export const TICKET_RESUMEN_REPOSITORY = Symbol('TICKET_RESUMEN_REPOSITORY');
// Puedes usar "abstract class" o "interface". Dejo abstract class como lo tenías.
export abstract class TicketResumenRepository {
  // CREATE
  abstract create(ticketResumen: TicketResumen): Promise<TicketResumen>;

  // READ
  abstract findById(id: number): Promise<TicketResumen | null>;

  // Muy útil porque ticketId es único en la tabla
  abstract findByTicketId(ticketId: number): Promise<TicketResumen | null>;

  abstract getAll(): Promise<TicketResumen[]>;

  // UPDATE
  abstract update(ticketResumen: TicketResumen): Promise<TicketResumen>;

  // DELETE
  abstract deleteById(id: number): Promise<TicketResumen | null>;
  abstract deleteAll(): Promise<number>;
}
