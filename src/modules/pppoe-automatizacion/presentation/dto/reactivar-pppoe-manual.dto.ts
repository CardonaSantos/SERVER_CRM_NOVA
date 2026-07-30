import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Datos administrativos necesarios para reactivar
 * una cuenta PPPoE suspendida.
 *
 * La empresa, el operador y la cuenta no se reciben
 * desde el body.
 */
export class ReactivarPppoeManualDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  claveIdempotencia: string;

  @IsString()
  @MinLength(5)
  @MaxLength(2_000)
  motivo: string;
}
