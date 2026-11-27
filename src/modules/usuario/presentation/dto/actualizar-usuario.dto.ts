import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

/** Solo lo que llega cambia. Contraseña y estado tienen su propia ruta. */
export class ActualizarUsuarioDto {
  /** Nombre visible */
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  /** Correo para iniciar sesión */
  @IsOptional()
  @Recortar()
  @IsEmail()
  @MaxLength(190)
  correo?: string;

  /** Teléfono; `null` o vacío lo quita */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  /** Rol en el CRM; el propio no se cambia */
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;
}
