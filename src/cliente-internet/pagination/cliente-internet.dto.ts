// cliente-internet.dto.ts
import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsPositive,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum EstadoCliente {
  ACTIVO = 'ACTIVO',
  PENDIENTE_ACTIVO = 'PENDIENTE_ACTIVO',
  PAGO_PENDIENTE = 'PAGO_PENDIENTE',
  MOROSO = 'MOROSO',
  ATRASADO = 'ATRASADO',
  SUSPENDIDO = 'SUSPENDIDO',
  DESINSTALADO = 'DESINSTALADO',
  EN_INSTALACION = 'EN_INSTALACION',
}

function csvOrArrayToNumberArray(value: unknown): number[] | undefined {
  if (Array.isArray(value)) {
    return value.map(Number).filter(Number.isFinite);
  }
  if (typeof value === 'string') {
    return value.split(',').map(Number).filter(Number.isFinite);
  }
  return undefined;
}

export class GetClientesRutaQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @IsPositive()
  empresaId?: number;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(EstadoCliente)
  estado?: EstadoCliente;

  // ZONAS (multi)
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => csvOrArrayToNumberArray(value))
  zonaIds?: number[];

  // SECTORES (multi)
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => csvOrArrayToNumberArray(value))
  sectorIds?: number[];

  @IsOptional()
  @IsIn(['nombre', 'saldo'])
  sortBy: 'nombre' | 'saldo' = 'nombre';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortDir: 'asc' | 'desc' = 'asc';

  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  perPage = 10;
}
