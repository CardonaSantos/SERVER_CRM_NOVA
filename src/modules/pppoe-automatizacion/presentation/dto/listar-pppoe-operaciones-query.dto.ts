import { Transform, Type } from 'class-transformer';

import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

import { OrigenOperacionPppoe } from 'src/modules/pppoe-auditoria/domain/enums/pppoe-auditoria-enums';

import {
  CanalOperacionPppoe,
  EstadoOperacionPppoe,
  TipoOperacionPppoe,
} from 'src/modules/pppoe-operacion/domain/enums/pppoe-operacion-operacion-paso.enums';

function normalizeArrayQuery(value: unknown): string[] | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  const values = Array.isArray(value) ? value : [value];

  const normalized = values.flatMap((item) =>
    String(item)
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean),
  );

  return normalized.length > 0 ? [...new Set(normalized)] : undefined;
}

function normalizeBooleanQuery(value: unknown): boolean | undefined {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (value === true || value === 'true') {
    return true;
  }

  if (value === false || value === 'false') {
    return false;
  }

  return value as boolean;
}

export class ListarPppoeOperacionesQueryDto {
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  empresaId: number;

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
  cuentaPppoeId?: number;

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
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  instalacionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  desinstalacionId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  iniciadoPorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  reautenticadoPorId?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  reintentoDeId?: number;

  @IsOptional()
  @Transform(({ value }) => normalizeArrayQuery(value))
  @IsArray()
  @IsEnum(TipoOperacionPppoe, {
    each: true,
  })
  tipos?: TipoOperacionPppoe[];

  @IsOptional()
  @Transform(({ value }) => normalizeArrayQuery(value))
  @IsArray()
  @IsEnum(OrigenOperacionPppoe, {
    each: true,
  })
  origenes?: OrigenOperacionPppoe[];

  @IsOptional()
  @Transform(({ value }) => normalizeArrayQuery(value))
  @IsArray()
  @IsEnum(CanalOperacionPppoe, {
    each: true,
  })
  canales?: CanalOperacionPppoe[];

  @IsOptional()
  @Transform(({ value }) => normalizeArrayQuery(value))
  @IsArray()
  @IsEnum(EstadoOperacionPppoe, {
    each: true,
  })
  estados?: EstadoOperacionPppoe[];

  @IsOptional()
  @Transform(({ value }) => normalizeBooleanQuery(value))
  @IsBoolean()
  requiereReautenticacion?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  numeroIntento?: number;

  @IsOptional()
  @IsDateString()
  fechaDesde?: string;

  @IsOptional()
  @IsDateString()
  fechaHasta?: string;

  @IsOptional()
  @IsIn(['creadoEn', 'iniciadoEn', 'finalizadoEn', 'numeroIntento'])
  ordenPor?: 'creadoEn' | 'iniciadoEn' | 'finalizadoEn' | 'numeroIntento';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  ordenDireccion?: 'asc' | 'desc';
}
