import { Type } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsISO8601,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

export class ListarHistorialTrackingQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  @IsOptional()
  @IsISO8601()
  fechaDesde?: string;

  @IsOptional()
  @IsISO8601()
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(EstadoTrackingTecnico)
  estadoSesion?: EstadoTrackingTecnico;
}
