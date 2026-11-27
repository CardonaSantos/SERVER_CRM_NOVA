import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

/** Contraseña nueva de otro usuario (o la propia, en `/usuarios/yo/contrasena`). */
export class CambiarContrasenaUsuarioDto {
  /** Su contraseña: la de quien hace el cambio. Con un step-up vigente no hace falta */
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  contrasenaActual: string;

  /** Contraseña nueva, de 8 caracteres o más */
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  contrasenaNueva: string;
}
