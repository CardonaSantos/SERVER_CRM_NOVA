import {
  Equals,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsPositive,
} from 'class-validator';

export class RecuperarPppoeOperacionDto {
  @IsInt()
  @IsPositive()
  empresaId: number;

  @IsBoolean()
  @Equals(true)
  confirmarAbandono: true;

  @IsOptional()
  @IsDateString()
  fecha?: string;
}
