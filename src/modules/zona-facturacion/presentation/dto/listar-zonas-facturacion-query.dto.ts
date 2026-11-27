import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { OrdenZonaFacturacion } from '../../domain/enums/orden-zona-facturacion.enum';

export class ListarZonasFacturacionQueryDto extends PaginacionQueryDto {
  /** Columna de orden */
  @IsOptional()
  @IsEnum(OrdenZonaFacturacion)
  sortBy?: OrdenZonaFacturacion;
}
