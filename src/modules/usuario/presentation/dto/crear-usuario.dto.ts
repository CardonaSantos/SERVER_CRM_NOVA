import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';
import { RolUsuario } from '../../domain/enums/rol-usuario.enum';

export class CrearUsuarioDto {
  /** Nombre visible */
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nombre: string;

  /** Correo para iniciar sesión; único entre los usuarios no eliminados */
  @Recortar()
  @IsEmail()
  @MaxLength(190)
  correo: string;

  /** Teléfono de contacto */
  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string | null;

  /** Rol en el CRM */
  @IsEnum(RolUsuario)
  rol: RolUsuario;

  /** Contraseña inicial, de 8 caracteres o más */
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  contrasena: string;
}
