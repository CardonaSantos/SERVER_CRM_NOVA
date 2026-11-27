import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { EstadoFactura } from '../../domain/enums/estado-factura.enum';

export class ListarFacturasQueryDto extends PaginacionQueryDto {
  /** Zona de facturación */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;

  /** Municipio del cliente */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  municipioId?: number;

  /** Departamento del cliente */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamentoId?: number;

  /** Sector del cliente */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectorId?: number;

  /** Estado de la factura */
  @IsOptional()
  @IsEnum(EstadoFactura)
  estado?: EstadoFactura;
}
