import { UpdateTicketSolucioneDto } from '../dto/update-ticket-solucione.dto';
import { SolucionTicket } from './ticket-soluciones.entity';
//EL REPOSITORY DE DOMINIO, DEBE MANDAR A INFRAESTRYUCTURA
export abstract class TicketSolucionRepository {
  abstract create(ticket: SolucionTicket): Promise<SolucionTicket>;
  abstract findById(id: number): Promise<SolucionTicket | null>;
  //UPDATE
  abstract update(
    id: number,
    dto: UpdateTicketSolucioneDto,
  ): Promise<SolucionTicket | null>;
  //GET
  abstract getAll(): Promise<SolucionTicket[] | null>;
  //DELETE
  abstract deleteById(id: number): Promise<SolucionTicket | null>;
  abstract deleteAll(): Promise<number | null>;

}
