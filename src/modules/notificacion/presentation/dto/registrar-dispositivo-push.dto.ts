import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

/** El usuario y la sesión salen del token; la instalación va en la ruta. */
export class RegistrarDispositivoPushDto {
  /** Token nativo de FCM. Nunca se registra en logs. */
  @IsString()
  @MinLength(20)
  @MaxLength(4096)
  token: string;

  /** Nombre del teléfono (informativo). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  nombreDispositivo?: string;

  /** Modelo del teléfono (informativo). */
  @IsOptional()
  @IsString()
  @MaxLength(120)
  modeloDispositivo?: string;

  /** Versión de la app (informativo). */
  @IsOptional()
  @IsString()
  @MaxLength(40)
  versionApp?: string;
}
