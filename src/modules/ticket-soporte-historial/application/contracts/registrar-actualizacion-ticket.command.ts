import {
  TicketHistorialActor,
  TicketHistorialCambio,
} from '../../domain/types/ticket-historial-cambio.type';

export type RegistrarActualizacionTicketCommand = {
  ticketId: number;
  actor?: TicketHistorialActor | null;
  cambios: readonly TicketHistorialCambio[];

  /** Prefijo opcional. Por defecto: "Ticket actualizado". */
  descripcion?: string | null;
};
