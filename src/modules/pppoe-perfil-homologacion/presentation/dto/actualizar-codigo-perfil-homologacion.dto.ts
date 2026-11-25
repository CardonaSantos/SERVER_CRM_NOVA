import { Type } from 'class-transformer';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class ActualizarCodigoPerfilHomologacionDto {
  /** Nombre exacto del profile en MikroTik. */
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  codigoPerfil: string;

  /** Ignorado: el autor sale de la sesión. Se acepta por compatibilidad. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actualizadoPorId?: number;
}
