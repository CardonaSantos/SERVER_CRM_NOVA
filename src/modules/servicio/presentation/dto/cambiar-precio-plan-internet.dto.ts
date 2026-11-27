import {
  IsNotEmpty,
  IsNumber,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CambiarPrecioPlanInternetDto {
  /** Precio mensual nuevo: 0 o mayor, hasta 2 decimales */
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  precio: number;

  /** Contraseña del usuario (no hace falta con un step-up vigente) */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contrasenaActual: string;
}
