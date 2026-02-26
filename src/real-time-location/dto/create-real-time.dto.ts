import { IsNumber, IsOptional, Max, Min } from 'class-validator';

export class CreateRealTimeDto {
  @IsNumber()
  usuarioId: number;

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
  @Min(0)
  @Max(100)
  bateria?: number;
}
