import { TicketSoporteHistorialTipo } from '../domain/enums/ticket-soporte-historial-tipo.enum';
import {
  TicketHistorialActor,
  TicketHistorialCambio,
} from '../domain/props/ticket-historial-cambio.props';

/**
 * API pública de ticket-soporte-historial (estándar §8): registrar entradas
 * en la bitácora de un ticket. Si el que llama ya abrió una unidad de trabajo,
 * la entrada se guarda dentro de ella.
 */
export const TICKET_SOPORTE_HISTORIAL = Symbol('TICKET_SOPORTE_HISTORIAL');

export type RegistrarEventoTicketHistorialInput = {
  ticketId: number;

  /** Quien actuó; sin actor la entrada queda a nombre de "Sistema". */
  actor?: TicketHistorialActor | null;

  tipo: TicketSoporteHistorialTipo;

  /**
   * Texto principal del evento. Si además se envían cambios, el detalle de
   * esos cambios se añade a esta descripción.
   */
  descripcion?: string | null;

  /** Solo se usan para construir la descripción; no se guardan como JSON. */
  cambios?: readonly TicketHistorialCambio[];
};

export type RegistrarActualizacionTicketInput = {
  ticketId: number;
  actor?: TicketHistorialActor | null;
  cambios: readonly TicketHistorialCambio[];

  /** Prefijo opcional. Por defecto: "Ticket actualizado". */
  descripcion?: string | null;
};

export interface TicketSoporteHistorialFacadePort {
  /** Registra un evento y devuelve el id de la entrada creada. */
  registrarEvento(input: RegistrarEventoTicketHistorialInput): Promise<number>;

  /**
   * Registra una actualización: el tipo se infiere de los cambios reales.
   * Devuelve `null` (sin guardar nada) si ningún cambio cambió de verdad.
   */
  registrarActualizacion(
    input: RegistrarActualizacionTicketInput,
  ): Promise<number | null>;
}
