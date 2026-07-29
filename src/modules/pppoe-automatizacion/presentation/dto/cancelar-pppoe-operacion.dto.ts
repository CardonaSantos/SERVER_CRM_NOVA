import {
  IsInt,
  IsPositive,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CancelarPppoeOperacionDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsString()
  @MinLength(1)
  @MaxLength(2_000)
  motivo: string;
}
