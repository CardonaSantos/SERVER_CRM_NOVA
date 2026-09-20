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

export class UpdateMikroTikDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  nombre?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  password?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  host?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(65_535)
  sshPort?: number;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  usuario?: string;

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
