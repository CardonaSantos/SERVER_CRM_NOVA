import { Type } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { Recortar } from 'src/common/http/transformaciones-query';
import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-cliente.enum';
import { ESTADOS_CLIENTE_FILTRABLES } from './listar-clientes-query.dto';

export class ListarClientesCampaniaQueryDto {
  /** Parte del nombre o apellidos */
  @IsOptional()
  @Recortar()
  @IsString()
  @MaxLength(255)
  nombre?: string;

  /** Zona de facturación */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  zonaId?: number;

  /** Sector */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectorId?: number;

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

  /** Estado operativo */
  @IsOptional()
  @IsIn(ESTADOS_CLIENTE_FILTRABLES)
  estado?: string;

  /** Estado de cobranza */
  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;

  /** Cantidad exacta de facturas con deuda */
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  facturasPendientes?: number;
}
