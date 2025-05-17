// update-user.dto.ts
import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsBoolean,
  IsPhoneNumber,
} from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class UpdateOneUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  contrasena?: string; // En producción, manejar contraseña con hashing

  @IsOptional()
  @IsPhoneNumber('GT') // código país GT para Guatemala (puedes ajustar)
  telefono?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
