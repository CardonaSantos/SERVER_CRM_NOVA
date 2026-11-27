import { TicketEntity } from '../entities/ticket.entity';
import { CicloTrabajo } from '../policies/tiempos-ticket.policy';

export const TICKET_REPOSITORY = Symbol('TICKET_REPOSITORY');

export type CerrarResumenParams = {
  ticketId: number;
  solucionId: number | null;
  resueltoComo: string | null;
  notasInternas: string | null;
  tiempoTotalMinutos: number;
  /** `null` cuando no hubo registro de trabajo. */
  tiempoTecnicoMinutos: number | null;
};

export interface TicketRepositoryPort {
  findById(id: number): Promise<TicketEntity | null>;

  /**
   * Como `findById`, pero bloquea la fila hasta que termine la unidad de
   * trabajo: dos cambios sobre el mismo ticket no se pisan.
   */
  bloquear(id: number): Promise<TicketEntity | null>;

  create(ticket: TicketEntity): Promise<TicketEntity>;

  /** Guarda el ticket y deja sus apoyos y etiquetas como los de la entidad. */
  update(ticket: TicketEntity): Promise<TicketEntity>;

  ciclos(ticketId: number): Promise<CicloTrabajo[]>;

  abrirCiclo(ticketId: number, tecnicoId: number, inicio: Date): Promise<void>;

  cerrarCiclo(cicloId: number, fin: Date, minutos: number): Promise<void>;

  /** Cuántas veces se reabrió. */
  reaperturas(ticketId: number): Promise<number>;

  /** Crea o actualiza el resumen del cierre; conserva las reaperturas. */
  cerrarResumen(params: CerrarResumenParams): Promise<void>;

  /** Suma una reapertura al resumen del ticket. */
  registrarReapertura(ticketId: number): Promise<void>;
}
