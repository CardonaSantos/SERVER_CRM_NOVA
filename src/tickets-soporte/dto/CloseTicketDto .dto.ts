// close-ticket.dto.ts
import { UpdateTicketsSoporteDto } from './update-tickets-soporte.dto';

export class CloseTicketDto extends UpdateTicketsSoporteDto {
  ticketId: number;
  usuarioId: number; 
  solucionId:number
  resueltoComo:string
  notasInternas:string
}
