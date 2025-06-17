import { PartialType } from '@nestjs/mapped-types';
import {
  IsEnum,
  IsBoolean,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
} from 'class-validator';
import { EstadoMetaTicket } from '@prisma/client';

export class CreateMetasTicketDto {
  @IsInt()
  tecnicoId: number;

  @IsDateString()
  fechaInicio: Date;

  @IsDateString()
  fechaFin: Date;

  @IsInt()
  metaTickets: number;

  @IsOptional()
  @IsString()
  titulo?: string;
}
