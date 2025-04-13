import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { TipoPlantilla } from '@prisma/client';

export class CreatePlantillaMensajeDto {
  @IsNotEmpty()
  @IsString()
  nombre: string;

  @IsEnum(TipoPlantilla)
  tipo: TipoPlantilla;

  @IsNotEmpty()
  @IsString()
  body: string;

  @IsNotEmpty()
  empresaId: number;
}
