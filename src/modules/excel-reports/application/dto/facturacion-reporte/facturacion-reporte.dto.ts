import { Transform, Type } from 'class-transformer';

import {
  IsArray,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Max,
  Min,
} from 'class-validator';

import {
  FacturacionReporteEstadoFactura,
  type FacturacionReporteEstadoFactura as FacturacionReporteEstadoFacturaType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteMetodoPago,
  type FacturacionReporteMetodoPago as FacturacionReporteMetodoPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import {
  FacturacionReporteOrigenPago,
  type FacturacionReporteOrigenPago as FacturacionReporteOrigenPagoType,
} from '../../../domain/enums/facturacion-report/facturacion-reporte-origen-pago.enum';

// QUERY HELPERS

function normalizeStringArray(value: unknown): string[] {
  if (value === undefined || value === null || value === '') {
    return [];
  }

  const values = Array.isArray(value) ? value : [value];

  return [
    ...new Set(
      values
        .flatMap((item) => String(item).split(','))
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ];
}

function normalizeNumberArray(value: unknown): number[] {
  return normalizeStringArray(value).map((item) => Number(item));
}

// DTO

export class ExportarFacturacionReporteDto {
  // PERÍODO

  /**
   * FacturaInternet.periodo.
   *
   * Formato:
   * YYYYMM
   *
   * Ejemplo:
   * 202501
   */
  @IsOptional()
  @Matches(/^(?:19\d{2}|[2-9]\d{3})(?:0[1-9]|1[0-2])$/, {
    message: 'periodoDesde debe utilizar el formato YYYYMM con un mes válido',
  })
  periodoDesde?: string;

  @IsOptional()
  @Matches(/^(?:19\d{2}|[2-9]\d{3})(?:0[1-9]|1[0-2])$/, {
    message: 'periodoHasta debe utilizar el formato YYYYMM con un mes válido',
  })
  periodoHasta?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'mesesProyeccion debe ser un entero',
  })
  @Min(0, {
    message: 'mesesProyeccion debe ser mayor o igual a cero',
  })
  @Max(24, {
    message: 'mesesProyeccion no puede exceder 24',
  })
  mesesProyeccion?: number;

  // FACTURACIÓN

  @IsOptional()
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @IsEnum(FacturacionReporteEstadoFactura, {
    each: true,
    message: 'Cada estado de factura debe ser válido',
  })
  estadosFactura?: FacturacionReporteEstadoFacturaType[];

  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada zonaId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada zonaId debe ser mayor que cero',
  })
  zonaIds?: number[];

  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada creadorId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada creadorId debe ser mayor que cero',
  })
  creadorIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'clienteId debe ser un entero',
  })
  @Min(1, {
    message: 'clienteId debe ser mayor que cero',
  })
  clienteId?: number;

  // COBRANZA

  @IsOptional()
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @IsEnum(FacturacionReporteMetodoPago, {
    each: true,
    message: 'Cada método de pago debe ser válido',
  })
  metodosPago?: FacturacionReporteMetodoPagoType[];

  @IsOptional()
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @IsEnum(FacturacionReporteOrigenPago, {
    each: true,
    message: 'Cada origen de pago debe ser válido',
  })
  origenesPago?: FacturacionReporteOrigenPagoType[];

  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada cobradorId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada cobradorId debe ser mayor que cero',
  })
  cobradorIds?: number[];

  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada rutaId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada rutaId debe ser mayor que cero',
  })
  rutaIds?: number[];
}
