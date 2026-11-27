import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

/** Solo lo que llega cambia. Correo y rol los cambia el super administrador. */
export class ActualizarMiPerfilDto {
  /** Nombre visible */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  /** Teléfono; `null` o vacío lo quita */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  /** Descripción corta; `null` o vacío la quita */
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null;

  /** Recibir avisos por WhatsApp */
  @IsOptional()
  @IsBoolean()
  notificarWhatsApp?: boolean;

  /** Recibir notificaciones push */
  @IsOptional()
  @IsBoolean()
  notificarPush?: boolean;

  /** Sonido en las notificaciones */
  @IsOptional()
  @IsBoolean()
  notificarSonido?: boolean;
}
