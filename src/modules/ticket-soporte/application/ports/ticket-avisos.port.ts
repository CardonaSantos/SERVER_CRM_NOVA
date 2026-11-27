export const TICKET_AVISOS = Symbol('TICKET_AVISOS');

export type TicketParaAviso = {
  id: number;
  empresaId: number | null;
  titulo: string | null;
  /** Estado tal como se guarda: es el que escuchan la app y el panel. */
  estado: string;
  prioridad: string;
};

export type AvisoAsignacion = {
  ticket: TicketParaAviso;
  agregados: number[];
  retirados: number[];
  motivo: 'CREATED' | 'REASSIGNED';
};

export type AvisoClienteTicketCreado = {
  ticketId: number;
  titulo: string | null;
  nombreCliente: string | null;
  telefonos: Array<string | null | undefined>;
};

/**
 * Efectos externos de un ticket (tiempo real, push, WhatsApp y notificaciones).
 * Se llaman después de guardar y ninguno lanza: un aviso fallido no deshace
 * el cambio.
 */
export interface TicketAvisosPort {
  asignacion(aviso: AvisoAsignacion): Promise<void>;

  cambioEstado(
    ticket: TicketParaAviso,
    nombreTecnico: string | null,
  ): Promise<void>;

  clienteTicketCreado(aviso: AvisoClienteTicketCreado): Promise<void>;

  /** Notificación interna de un ticket creado por el bot. */
  ticketDelBot(ticket: {
    id: number;
    titulo: string | null;
    descripcion: string | null;
  }): Promise<void>;
}
