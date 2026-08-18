import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { Transform, Type } from 'class-transformer';

import { EstadoCliente } from '../../domain/enums/estado-clientes-actualizado.enum';

import { EstadoCobranzaCliente } from '../../domain/enums/estado-cobranza-clientes.enum';

export class ExportarClientesReporteDto {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  @IsOptional()
  @IsEnum(EstadoCobranzaCliente)
  estadoCobranza?: EstadoCobranzaCliente;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  servicioInternetId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sectorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  municipioId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  departamentoId?: number;

  @IsOptional()
  @IsDateString()
  fechaCreadoDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaCreadoHasta?: string;

  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  @IsBoolean()
  incluirEliminados?: boolean;
}
