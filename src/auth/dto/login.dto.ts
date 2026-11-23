import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @IsEmail()
  @IsString()
  correo: string;

  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  contrasena: string;

  /**
   * Cliente que inicia sesión. Define la duración de la sesión
   * (WEB 7/3/14 días, ANDROID 30/30/90). Por omisión, WEB.
   */
  @IsOptional()
  @IsIn(['WEB', 'ANDROID'])
  plataforma?: 'WEB' | 'ANDROID';

  /** Obligatorio con plataforma ANDROID: UsuarioPushDispositivo.instalacionId. */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  instalacionId?: string;
}
