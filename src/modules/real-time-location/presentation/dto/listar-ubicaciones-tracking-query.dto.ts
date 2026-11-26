import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/** Máximo de puntos por página: el recorrido GPS necesita lotes mayores que una tabla normal. */
export const LIMITE_MAXIMO_UBICACIONES = 1000;

export class ListarUbicacionesTrackingQueryDto {
  /** Solo los puntos de esta sesión de tracking. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sesionTrackingId?: number;

  /** Página desde 1. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  /** Puntos por página: por defecto 250, máximo 1000. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(LIMITE_MAXIMO_UBICACIONES)
  limit?: number;
}
