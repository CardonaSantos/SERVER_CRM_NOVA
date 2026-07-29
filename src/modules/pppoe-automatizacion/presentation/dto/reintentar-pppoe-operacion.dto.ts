import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class ReintentarPppoeOperacionDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(255)
  claveIdempotencia: string;

  @IsOptional()
  @IsString()
  @MaxLength(2_000)
  motivo?: string;
}
