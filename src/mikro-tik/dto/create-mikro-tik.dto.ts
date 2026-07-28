import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMikroTikDto {
  @IsInt()
  @Min(1)
  empresaId: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nombre: string;

  /**
   * Contraseña plana recibida temporalmente.
   *
   * Nunca se persiste directamente.
   */
  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65_535)
  sshPort?: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  usuario: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  descripcion?: string | null;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  oltId?: number | null;
}
