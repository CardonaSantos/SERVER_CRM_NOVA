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

export class AdminUpdateUserDto {
  @IsInt()
  @Min(1)
  userId: number;

  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  correo?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  nuevaContrasena?: string;

  @IsString()
  adminPassword: string;
}
