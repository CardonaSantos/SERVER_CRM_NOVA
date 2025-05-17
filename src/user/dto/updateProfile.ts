// src/user/dto/update-user.dto.ts
import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsEnum,
} from 'class-validator';

export enum RolUsuario {
  TECNICO = 'TECNICO',
  OFICINA = 'OFICINA',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  COBRADOR = 'COBRADOR',
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  nombre?: string;

  @IsOptional()
  @IsEmail()
  correo?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsString()
  contrasena?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rolUsuario?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;
}
