// close-ticket.dto.ts
import { UpdateTicketsSoporteDto } from './update-tickets-soporte.dto';

export class CloseTicketDto extends UpdateTicketsSoporteDto {
  comentario: string; // Último comentario que se guarda como seguimiento
  ticketId: number;
  usuarioId: number;
}
