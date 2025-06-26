import { PartialType } from '@nestjs/mapped-types';
import { CreateMetasTicketDto } from './create-metas-ticket.dto';
import { EstadoMetaTicket } from '@prisma/client';

export class UpdateMetasTicketDto extends PartialType(CreateMetasTicketDto) {
  estado: EstadoMetaTicket;
}
