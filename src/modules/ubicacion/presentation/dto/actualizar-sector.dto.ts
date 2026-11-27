import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

/** Todos los campos son opcionales: lo que no llega no cambia. */
export class ActualizarSectorDto {
  /** Nombre */
  @ValidateIf((_, valor) => valor !== undefined)
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre?: string;

  /** Descripción; `null` o vacío la quitan */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string | null;

  /** Municipio; solo cambia si el sector no tiene clientes */
  @ValidateIf((_, valor) => valor !== undefined)
  @IsInt()
  @Min(1)
  municipioId?: number;
}
