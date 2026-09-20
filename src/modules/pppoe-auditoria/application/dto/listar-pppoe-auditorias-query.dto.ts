import { Type } from 'class-transformer';

import {
  IsDateString,
  IsEnum,
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

export class ListarPppoeAuditoriasQueryDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  empresaId: number;

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
  @IsEnum(AccionAuditoriaPppoe)
  accion?: AccionAuditoriaPppoe;

  @IsOptional()
  @IsEnum(OrigenOperacionPppoe)
  origen?: OrigenOperacionPppoe;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  clienteId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  instalacionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  accesoInternetId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  cuentaPppoeId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  perfilHomologacionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  operadorId?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  ordenPor?: 'creadoEn' | 'id';
  ordenDireccion?: 'asc' | 'desc';
}
