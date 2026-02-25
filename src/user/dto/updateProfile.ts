import {
  IsOptional,
  IsString,
  IsEmail,
  IsBoolean,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum RolUsuario {
  TECNICO = 'TECNICO',
  OFICINA = 'OFICINA',
  ADMIN = 'ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
  COBRADOR = 'COBRADOR',
}

// Función auxiliar para transformar strings de FormData a booleanos
const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1' || value === 1)
      return true;
    if (value === 'false' || value === false || value === '0' || value === 0)
      return false;
    return value;
  });

export class UpdateUserDto {
  // ===== DATOS DEL USUARIO =====
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
  rol?: RolUsuario; // <--- CAMBIA 'rolUsuario' POR 'ro

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  activo?: boolean;

  // ===== DATOS DEL PERFIL =====
  @IsOptional()
  @IsString()
  bio?: string;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  notificarWhatsApp?: boolean;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  notificarPush?: boolean;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  notificarSonido?: boolean;
}
