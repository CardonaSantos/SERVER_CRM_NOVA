import { RolUsuario } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateUserDto {
  @IsInt()
  @Min(1)
  empresaId: number;

  @IsString()
  @MaxLength(160)
  nombre: string;

  @IsEmail()
  @MaxLength(190)
  correo: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @IsString()
  @MinLength(8)
  @MaxLength(200)
  contrasena: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  contrasenaConfirm?: string;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
