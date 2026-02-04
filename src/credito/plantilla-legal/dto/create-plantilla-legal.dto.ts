import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsString,
  MaxLength,
} from 'class-validator';
import { TipoPlantillaLegal } from '@prisma/client';

export class CreatePlantillaLegalDto {
  @IsEnum(TipoPlantillaLegal, {
    message: 'El tipo de plantilla no es válido',
  })
  tipo: TipoPlantillaLegal;

  @IsString()
  @IsNotEmpty({ message: 'El nombre de la plantilla es obligatorio' })
  @MaxLength(150, {
    message: 'El nombre no puede exceder los 150 caracteres',
  })
  nombre: string;

  @IsString()
  @IsNotEmpty({ message: 'El contenido de la plantilla no puede estar vacío' })
  contenido: string;

  @IsString()
  @IsNotEmpty({ message: 'La versión de la plantilla es obligatoria' })
  @MaxLength(50, {
    message: 'La versión no puede exceder los 50 caracteres',
  })
  version: string;

  @IsBoolean()
  activa?: boolean;
}
