import { RolUsuario } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * POST /auth/regist-user (solo SUPER_ADMIN). El id lo asigna la BD: ya no
 * se acepta en el body. Antes @Min(8) sobre un string (siempre fallaba) e
 * `id`/`activo` obligatorios hacían imposible validar este DTO.
 */
export class CreateAuthDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  nombre: string;

  @IsEmail()
  @MaxLength(254)
  correo: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  /** Misma regla que el login: mínimo 8 caracteres. */
  @IsString()
  @MinLength(8)
  @MaxLength(512)
  contrasena: string;

  /** Opcional; el front puede enviarla, el servidor no la usa. */
  @IsOptional()
  @IsString()
  @MaxLength(512)
  contrasenaConfirm?: string;

  /** Opcional; todo usuario nuevo se crea activo. */
  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsInt()
  @IsPositive()
  empresaId: number;
}
