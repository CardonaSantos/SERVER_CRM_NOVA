import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class SuspenderPppoeManualDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsInt()
  @IsPositive()
  cuentaPppoeId: number;

  @IsOptional()
  @IsInt()
  @IsPositive()
  instalacionId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  claveIdempotencia: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  motivo?: string;
}
