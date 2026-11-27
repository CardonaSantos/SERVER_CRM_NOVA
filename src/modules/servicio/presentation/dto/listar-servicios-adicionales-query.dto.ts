import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import { OrdenServicioAdicional } from '../../domain/enums/orden-servicio-adicional.enum';

export class ListarServiciosAdicionalesQueryDto extends PaginacionQueryDto {
  /** Estados a incluir; sin filtro, todos */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoServicio, { each: true })
  estados?: EstadoServicio[];

  /** Solo los de este tipo */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  tipoServicioId?: number;

  /** Columna de orden */
  @IsOptional()
  @IsEnum(OrdenServicioAdicional)
  sortBy?: OrdenServicioAdicional;
}
