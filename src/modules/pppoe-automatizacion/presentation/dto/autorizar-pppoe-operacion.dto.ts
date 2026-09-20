import {
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AutorizarPppoeOperacionDto {
  @IsOptional()
  @IsInt()
  @IsPositive()
  empresaId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password: string;
}
