import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class GetCustomersQueryDto {
  @IsOptional()
  @Type(() => Number) // Transforma "string" del query param a Number real
  @IsInt()
  @Min(1)
  page?: number = 1; // Valor por defecto si no viene

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limite?: number = 10; // Valor por defecto (10 es más estándar que 1)

  @IsOptional()
  @IsString()
  paramSearch?: string;

  // Filtros de IDs (Zonas, Municipios, etc)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  zonasFacturacionSelected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  muniSelected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  depaSelected?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sectorSelected?: number;

  @IsOptional()
  @IsString()
  estadoSelected?: string;
}
