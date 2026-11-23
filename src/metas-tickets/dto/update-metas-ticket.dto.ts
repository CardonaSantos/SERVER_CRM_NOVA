import { PartialType } from '@nestjs/swagger';
import { CreateMetasTicketDto } from './create-metas-ticket.dto';
import { EstadoMetaTicket } from '@prisma/client';

export class UpdateMetasTicketDto extends PartialType(CreateMetasTicketDto) {
  estado: EstadoMetaTicket;
}
