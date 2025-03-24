import { EstadoServicio } from '@prisma/client';
import {
  IsString,
  IsOptional,
  IsNumber,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';

export class CreateServicioDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsNumber()
  @Min(0)
  precio: number;

  @IsEnum(EstadoServicio)
  estado: EstadoServicio;

  @IsInt()
  tipoServicioId: number;

  @IsInt()
  empresaId: number;
}
