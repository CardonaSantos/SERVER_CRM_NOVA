import { IsNumber, IsOptional } from 'class-validator';

export class UpdateRealTimeDto {
  @IsNumber()
  latitud: number;

  @IsNumber()
  longitud: number;

  @IsOptional()
  @IsNumber()
  precision?: number;

  @IsOptional()
  @IsNumber()
  velocidad?: number;

  @IsOptional()
  @IsNumber()
  bateria?: number;
}
