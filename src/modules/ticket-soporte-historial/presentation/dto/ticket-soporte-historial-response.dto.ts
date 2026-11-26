import { TicketSoporteHistorialTipo } from '../../domain/enums/ticket-soporte-historial-tipo.enum';

export class TicketSoporteHistorialActorResponseDto {
  /** Usuario que hizo el cambio; `null` si lo hizo el sistema o el usuario ya no existe. */
  usuarioId: number | null;

  /** Nombre del usuario al momento de la acción ("Sistema" si no hubo usuario). */
  nombre: string;
}

export class TicketSoporteHistorialResponseDto {
  /** Id de la entrada. */
  id: number;

  /** Ticket al que pertenece. */
  ticketId: number;

  /** Tipo de evento. */
  tipo: TicketSoporteHistorialTipo;

  /** Texto del evento, con el detalle de los cambios. */
  descripcion: string | null;

  /** Quién lo hizo. */
  actor: TicketSoporteHistorialActorResponseDto;

  /** Momento del evento (ISO 8601). */
  creadoEn: string;
}
