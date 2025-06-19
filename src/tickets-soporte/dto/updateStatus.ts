// src/tickets-soporte/dto/update-ticket-status.dto.ts

import { IsEnum } from 'class-validator';
import { EstadoTicketSoporte } from '@prisma/client'; // trae el enum generado por Prisma

export class UpdateTicketStatusDto {
  @IsEnum(EstadoTicketSoporte)
  estado: EstadoTicketSoporte;
}
