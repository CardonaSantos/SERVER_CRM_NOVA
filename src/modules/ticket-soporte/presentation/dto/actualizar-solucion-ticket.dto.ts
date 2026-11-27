import { PartialType } from '@nestjs/swagger';
import { CrearSolucionTicketDto } from './crear-solucion-ticket.dto';

/** Solo cambia lo que llega; `descripcion: null` la vacía. */
export class ActualizarSolucionTicketDto extends PartialType(
  CrearSolucionTicketDto,
  { skipNullProperties: false },
) {}
