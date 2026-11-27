import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { ComoArreglo } from 'src/common/http/transformaciones-query';
import { EstadoRutaCobro } from '../../domain/enums/estado-ruta-cobro.enum';
import { OrdenRutaCobro } from '../../domain/enums/orden-ruta-cobro.enum';

export class ListarRutasCobroQueryDto extends PaginacionQueryDto {
  /** Uno o varios estados */
  @IsOptional()
  @ComoArreglo()
  @IsEnum(EstadoRutaCobro, { each: true })
  estados?: EstadoRutaCobro[];

  /** Rutas de un cobrador */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cobradorId?: number;

  /** Columna de orden; por defecto, creación */
  @IsOptional()
  @IsEnum(OrdenRutaCobro)
  sortBy?: OrdenRutaCobro;
}
