import { EstadoServicio } from '@prisma/client';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateTipoServicioDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsEnum(EstadoServicio)
  estado: EstadoServicio;
}
