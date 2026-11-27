import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearServicioAdicionalDto {
  /** Nombre; no puede repetirse entre los servicios vigentes */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  /** Descripción */
  @IsOptional()
  @IsString()
  @MaxLength(500)
  descripcion?: string;

  /** Precio: 0 o mayor, hasta 2 decimales */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;

  /** Tipo de servicio */
  @IsOptional()
  @IsInt()
  @Min(1)
  tipoServicioId?: number;
}
