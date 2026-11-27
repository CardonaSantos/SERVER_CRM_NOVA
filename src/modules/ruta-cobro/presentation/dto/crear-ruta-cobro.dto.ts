import {
  ArrayNotEmpty,
  IsArray,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearRutaCobroDto {
  /** Nombre de la ruta */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  /** Usuario activo que cobrará la ruta */
  @IsOptional()
  @IsInt()
  @Min(1)
  cobradorId?: number | null;

  /** Notas de la ruta */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  observaciones?: string | null;

  /** Clientes de la ruta (al menos uno) */
  @IsArray()
  @ArrayNotEmpty()
  @IsInt({ each: true })
  @Min(1, { each: true })
  clienteIds: number[];
}
