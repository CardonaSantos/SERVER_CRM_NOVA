import {
  IsInt,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class AutorizarPppoeOperacionDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password: string;
}
