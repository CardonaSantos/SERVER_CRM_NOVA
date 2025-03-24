// create-servicio-internet.dto.ts
import { IsString, IsOptional, IsNumber, IsEnum } from 'class-validator';
import { EstadoServicio } from '@prisma/client';

export class CreateServicioInternetDto {
  @IsString()
  nombre: string;

  @IsOptional()
  @IsString()
  velocidad?: string;

  @IsNumber()
  precio: number;

  // Opcional si deseas que se pueda sobreescribir el valor por defecto
  @IsOptional()
  @IsEnum(EstadoServicio)
  estado?: EstadoServicio;

  @IsNumber()
  empresaId: number;
}
