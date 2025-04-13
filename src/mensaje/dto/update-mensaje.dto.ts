import { IsEnum, IsOptional, IsString } from 'class-validator';
import { TipoPlantilla } from '@prisma/client';
export class UpdatePlantillaMensajeDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEnum(TipoPlantilla)
  tipo?: TipoPlantilla;

  @IsOptional()
  @IsString()
  body?: string;
}
