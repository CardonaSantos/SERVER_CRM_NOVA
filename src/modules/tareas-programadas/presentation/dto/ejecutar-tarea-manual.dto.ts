import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class EjecutarTareaManualDto {
  /** Contraseña del usuario (no hace falta con un step-up vigente) */
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  contrasenaActual: string;
}
