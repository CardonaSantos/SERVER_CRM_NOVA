import { PartialType } from '@nestjs/mapped-types';
import { CreateTicketsSoporteDto } from './create-tickets-soporte.dto';
import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';

export class UpdateTicketsSoporteDto extends PartialType(
  CreateTicketsSoporteDto,
) {
  /**
   * Ahora esperamos que la actualización de etiquetas se realice
   * mediante un array de objetos con la forma { value: number, label: string }.
   */
  tags?: { value: number; label: string }[];

  /**
   * Para actualizar el técnico asignado, podemos recibir un objeto con al menos el id.
   */
  assignee?: { id: number; name: string; initials?: string; avatar?: string };
  title: string;
  description: string;
  status: EstadoTicketSoporte;
  priority: PrioridadTicketSoporte;
}
