import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { OrdenSector } from '../../domain/enums/orden-sector.enum';

export class ListarSectoresQueryDto extends PaginacionQueryDto {
  /** Solo los de municipios de este departamento */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamentoId?: number;

  /** Solo los de este municipio */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  municipioId?: number;

  /** Columna de orden */
  @IsOptional()
  @IsEnum(OrdenSector)
  sortBy?: OrdenSector;
}
