import { Type } from 'class-transformer';
import { IsEnum, IsIn, IsInt, IsOptional, Min } from 'class-validator';
import { PaginacionQueryDto } from 'src/common/http/paginacion-query.dto';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import {
  EstadoOperativoCliente,
  EstadoOperativoLegacy,
} from '../../domain/enums/estado-operativo-cliente.enum';

export const ESTADOS_CLIENTE_FILTRABLES = [
  ...Object.values(EstadoOperativoCliente),
  ...Object.values(EstadoOperativoLegacy),
];

export class ListarClientesQueryDto extends PaginacionQueryDto {
  /** Zona de facturación */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;

  /** Municipio */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  municipioId?: number;

  /** Departamento */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamentoId?: number;

  /** Sector */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectorId?: number;

  /** Estado operativo */
  @IsOptional()
  @IsIn(ESTADOS_CLIENTE_FILTRABLES)
  estado?: string;

  /** Estado de cobranza */
  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;
}
