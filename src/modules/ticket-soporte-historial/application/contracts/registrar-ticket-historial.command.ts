import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';
import {
  TicketHistorialActor,
  TicketHistorialCambio,
} from '../../domain/types/ticket-historial-cambio.type';

export type RegistrarTicketHistorialCommand = {
  ticketId: number;
  actor?: TicketHistorialActor | null;
  tipo: TicketSoporteHistorialTipo;

  /**
   * Texto principal del evento. Si además se envían cambios,
   * el módulo añade el detalle de esos cambios a esta descripción.
   */
  descripcion?: string | null;

  /**
   * Sólo se usan para construir `descripcion`.
   * No se persisten como JSON.
   */
  cambios?: readonly TicketHistorialCambio[];
};
