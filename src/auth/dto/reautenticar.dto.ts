import { IsString, MaxLength, MinLength } from 'class-validator';

export class ReautenticarDto {
  /** Contraseña actual del usuario autenticado. */
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  contrasena: string;
}
