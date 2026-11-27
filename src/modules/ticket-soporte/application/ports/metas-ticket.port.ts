export const METAS_TICKET = Symbol('METAS_TICKET');

export interface MetasTicketPort {
  /** Suma un ticket resuelto a la meta abierta del técnico, si tiene una. */
  sumarResuelto(tecnicoId: number): Promise<void>;
}
