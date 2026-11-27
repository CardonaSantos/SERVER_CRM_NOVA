import { IsEnum, IsOptional } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { EstadoEnvio } from '../../domain/enums/campania.enum';

export class ListarEnviosCampaniaQueryDto extends PaginacionQueryDto {
  /** Solo los destinos en este estado */
  @IsOptional()
  @IsEnum(EstadoEnvio)
  estado?: EstadoEnvio;
}
