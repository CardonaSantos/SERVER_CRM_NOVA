import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { OrdenPlantillaContrato } from '../../domain/read-models/plantilla-contrato-listado.read-model';

export class ListarPlantillasContratoQueryDto extends PaginacionQueryDto {
  /** Columna de orden */
  @IsOptional()
  @IsEnum(OrdenPlantillaContrato)
  sortBy?: OrdenPlantillaContrato;
}
