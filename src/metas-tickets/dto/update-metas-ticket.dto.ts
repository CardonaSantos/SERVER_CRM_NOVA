import { PartialType } from '@nestjs/swagger';
import { CreateMetasTicketDto } from './create-metas-ticket.dto';
import { EstadoMetaTicket } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';

export class UpdateMetasTicketDto extends PartialType(CreateMetasTicketDto) {
  @IsOptional()
  @IsEnum(EstadoMetaTicket)
  estado?: EstadoMetaTicket;
}
