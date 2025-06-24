import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketsSoporteDto } from './create-tickets-soporte.dto';
import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';

export class UpdateTicketsSoporteDto extends PartialType(
  CreateTicketsSoporteDto,
) {
  tags?: { value: number; label: string }[];
  assignee?: { id: number; name: string; initials?: string; avatar?: string };
  title: string;
  description: string;
  status: EstadoTicketSoporte;
  priority: PrioridadTicketSoporte;
  companios: number[];
}
