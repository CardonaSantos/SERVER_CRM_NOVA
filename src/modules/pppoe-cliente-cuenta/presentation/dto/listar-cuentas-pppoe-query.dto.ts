import { Type } from 'class-transformer';

import {
  IsEnum,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

import { EstadoAccesoInternet } from 'src/modules/pppoe-acceso-internet/domain/enums/ppoe-acceso-internet.enum';

import { EstadoCuentaPppoe } from '../../domain/enums/pppoe-cliente-cuenta.enum';

import { OrigenCuentaPppoe } from '../../domain/read-models/cliente-pppoe-cuenta-listado.read-model';

export class ListarCuentasPppoeQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  @Max(100)
  limit?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  clienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  servicioInternetId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  mikrotikRouterId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  perfilHomologacionId?: number;

  @IsOptional()
  @IsEnum(EstadoCuentaPppoe)
  estadoCuenta?: EstadoCuentaPppoe;

  @IsOptional()
  @IsEnum(EstadoAccesoInternet)
  estadoAcceso?: EstadoAccesoInternet;

  @IsOptional()
  @IsEnum(OrigenCuentaPppoe)
  origen?: OrigenCuentaPppoe;
}
