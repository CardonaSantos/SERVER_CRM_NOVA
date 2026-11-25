import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import { DireccionOrden, LIMITE_MAXIMO } from 'src/common/hexagonal/paginacion';

import { Recortar } from './transformaciones-query';

/**
 * Base de todo `Listar<Recurso>QueryDto` (estándar §7.6).
 *
 * Cada recurso la extiende con sus filtros y con su propio `sortBy`
 * (un enum de las columnas permitidas):
 *
 * @example
 * export enum OrdenZonaFacturacion { NOMBRE = 'nombre', CREADO_EN = 'creadoEn' }
 *
 * export class ListarZonasFacturacionQueryDto extends PaginacionQueryDto {
 *   /** Columna de orden *\/
 *   @IsOptional() @IsEnum(OrdenZonaFacturacion)
 *   sortBy?: OrdenZonaFacturacion;
 * }
 */
export class PaginacionQueryDto {
  /** Página solicitada, desde 1. Por defecto 1. */
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

  /** Texto libre a buscar en las columnas que defina el recurso. */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(255)
  search?: string;

  /** Dirección del orden. */
  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir?: DireccionOrden;
}
