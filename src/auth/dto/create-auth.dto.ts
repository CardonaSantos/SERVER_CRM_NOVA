// import { Rol } from '@prisma/client';
import { RolUsuario } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsInt,
  IsNumber,
  IsString,
  Min,
} from 'class-validator';
enum Rol {
  ADMIN,
  USER,
}
export class CreateAuthDto {
  @IsNumber()
  id?: number;

  @IsString()
  nombre: string;

  @IsEmail()
  @IsString()
  correo: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @Min(8)
  @IsString()
  contrasena: string;

  @Min(8)
  @IsString()
  contrasenaConfirm?: string;

  @IsBoolean()
  activo: boolean;

  @IsInt()
  empresaId: number;
}
