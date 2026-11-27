import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { AgrupacionUbicacion } from '../../domain/enums/agrupacion-ubicacion.enum';

export class MesesQueryDto {
  /** Cuántos meses hasta el actual; por defecto 12 */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(36)
  meses?: number;
}

export class UbicacionQueryDto {
  /** Cómo agrupar; por defecto por zona de facturación */
  @IsOptional()
  @IsEnum(AgrupacionUbicacion)
  agrupar?: AgrupacionUbicacion;
}
