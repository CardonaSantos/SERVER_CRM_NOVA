import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';

export class CrearPlanInternetDto {
  /** Nombre del plan; no puede repetirse entre los planes vigentes */
  @Recortar()
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  nombre: string;

  /** Velocidad anunciada, p. ej. "20 Mbps" */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(100)
  velocidad?: string;

  /** Precio mensual: 0 o mayor, hasta 2 decimales */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;
}
