import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { EstadoServicio } from '../../domain/enums/estado-servicio.enum';
import { OrdenPlanInternet } from '../../domain/enums/orden-plan-internet.enum';

export class ListarPlanesInternetQueryDto extends PaginacionQueryDto {
  /** Estados a incluir; sin filtro, todos */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoServicio, { each: true })
  estados?: EstadoServicio[];

  /** Columna de orden */
  @IsOptional()
  @IsEnum(OrdenPlanInternet)
  sortBy?: OrdenPlanInternet;
}
