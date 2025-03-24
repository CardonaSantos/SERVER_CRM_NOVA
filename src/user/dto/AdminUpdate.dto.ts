import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsEnum,
  Min,
} from 'class-validator';

enum Rol {
  ADMIN,
  USER,
}

export class AdminUpdateUserDto {
  // Datos del usuario a editar
  @IsNumber()
  userId: number;

  @IsString()
  @IsOptional()
  nombre?: string;

  @IsString()
  @IsOptional()
  correo?: string;

  @IsEnum(Rol)
  @IsOptional()
  rol?: Rol;

  @IsBoolean()
  @IsOptional()
  activo?: boolean;

  @IsString()
  @IsOptional()
  @Min(8)
  nuevaContrasena?: string;

  // Credenciales del administrador que realiza la operación
  @IsString()
  adminPassword: string;
}
