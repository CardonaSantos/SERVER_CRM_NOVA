import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTicketsSoporteDto {
  @IsNumber()
  @IsNotEmpty()
  clienteId: number;
  @IsNumber()
  @IsNotEmpty()
  empresaId: number;
  @IsNumber()
  @IsOptional()
  tecnicoId?: number;
  @IsString()
  @IsNotEmpty()
  titulo: string;
  @IsString()
  @IsOptional()
  descripcion: string;
  @IsEnum(EstadoTicketSoporte)
  estado: EstadoTicketSoporte;
  @IsEnum(PrioridadTicketSoporte)
  prioridad: PrioridadTicketSoporte;
  @IsArray()
  etiquetas: number[];
  @IsNumber()
  @IsNotEmpty()
  userId: number;
}
