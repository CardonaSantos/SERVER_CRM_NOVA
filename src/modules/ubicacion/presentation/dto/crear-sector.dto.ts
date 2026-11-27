import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearSectorDto {
  /** Nombre; no puede repetirse en el mismo municipio */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  /** Descripción */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  /** Municipio al que pertenece */
  @IsInt()
  @Min(1)
  municipioId: number;
}
