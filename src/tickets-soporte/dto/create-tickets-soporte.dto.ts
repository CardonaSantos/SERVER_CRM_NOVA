import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateTicketsSoporteDto {
  @IsNumber()
  @IsNotEmpty()
  @IsOptional()
  clienteId: number;
  //los otros asoociados
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  tecnicosAdicionales?: number[]; // IDs de técnicos secundarios
  @IsNumber()
  @IsOptional()
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
