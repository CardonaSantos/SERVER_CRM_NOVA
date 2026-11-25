import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { LIMITE_MAXIMO } from 'src/common/hexagonal/paginacion';
import { ComoBooleano, Recortar } from 'src/common/http/transformaciones-query';

export class ListarPerfilesHomologacionQueryDto {
  /** Página, desde 1. Por defecto 1. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Registros por página. Por defecto 10, máximo 100. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO)
  limit?: number;

  /** Busca en código, router (nombre, host, descripción) y servicio. */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(100)
  search?: string;

  /** Solo activas (`true`) o solo inactivas (`false`). */
  @IsOptional()
  @ComoBooleano()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  mikrotikRouterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioInternetId?: number;
}
