import { Transform } from 'class-transformer';
import { RolUsuario } from '@prisma/client';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

const TransformBoolean = () =>
  Transform(({ value }) => {
    if (value === 'true' || value === true || value === '1' || value === 1) {
      return true;
    }
    if (
      value === 'false' ||
      value === false ||
      value === '0' ||
      value === 0
    ) {
      return false;
    }
    return value;
  });

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(190)
  correo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  telefono?: string;

  @IsOptional()
  @IsString()
  @MinLength(8)
  @MaxLength(200)
  contrasena?: string;

  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @TransformBoolean()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
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
