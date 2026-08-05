import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

import {
  AccionAuditoriaPppoe,
  OrigenOperacionPppoe,
} from '../../domain/enums/pppoe-auditoria-enums';

import {
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

export class ListarAuditoriaPppoeInstalacionQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 10;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsEnum(TipoOperacionPppoe)
  tipoOperacion?: TipoOperacionPppoe;

  @IsOptional()
  @IsEnum(EstadoOperacionPppoe)
  estadoOperacion?: EstadoOperacionPppoe;

  @IsOptional()
  @IsEnum(AccionAuditoriaPppoe)
  accion?: AccionAuditoriaPppoe;

  @IsOptional()
  @IsEnum(OrigenOperacionPppoe)
  origen?: OrigenOperacionPppoe;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordenDireccion: 'asc' | 'desc' = 'desc';
}
