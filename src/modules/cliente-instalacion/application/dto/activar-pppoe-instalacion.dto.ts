import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Confirma la identidad del operador de oficina
 * antes de crear y habilitar el secret PPPoE.
 */
export class ActivarPppoeInstalacionDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  contrasenaActual: string;
}
