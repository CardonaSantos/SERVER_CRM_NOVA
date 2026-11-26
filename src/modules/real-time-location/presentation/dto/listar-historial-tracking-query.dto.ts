import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { EstadoTrackingTecnico } from '../../domain/enums/estado-tracking-tecnico.enum';

export class ListarHistorialTrackingQueryDto extends PaginacionQueryDto {
  /** Solo las jornadas de este técnico. */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tecnicoId?: number;

  /** Desde (ISO 8601). */
  @IsOptional()
  @IsISO8601()
  fechaDesde?: string;

  /** Hasta (ISO 8601). */
  @IsOptional()
  @IsISO8601()
  fechaHasta?: string;

  /** Jornadas con al menos una sesión en este estado. */
  @IsOptional()
  @IsEnum(EstadoTrackingTecnico)
  estadoSesion?: EstadoTrackingTecnico;
}
