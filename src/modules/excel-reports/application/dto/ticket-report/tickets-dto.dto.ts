import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  Matches,
  Min,
} from 'class-validator';
import {
  TicketReporteAgrupacion,
  type TicketReporteAgrupacion as TicketReporteAgrupacionType,
} from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-agrupacion.enum';
import {
  TicketReporteEstado,
  type TicketReporteEstado as TicketReporteEstadoType,
} from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-report-estado';
import {
  TicketReportePrioridad,
  type TicketReportePrioridad as TicketReportePrioridadType,
} from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-prioridad.enum';

// =====================================================
// HELPERS DE QUERY STRING
// =====================================================

/**
 * Normaliza query params que pueden llegar como:
 *
 * ?estados=ABIERTA
 *
 * ?estados=ABIERTA,EN_PROCESO
 *
 * ?estados=ABIERTA&estados=EN_PROCESO
 *
 * Siempre devuelve un array limpio y sin duplicados.
 */
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

/**
 * Normaliza listas de IDs provenientes del query string.
 *
 * La validación posterior se encarga de rechazar:
 *
 * - NaN
 * - decimales
 * - cero
 * - negativos
 */
function normalizeNumberArray(value: unknown): number[] {
  return normalizeStringArray(value).map((item) => Number(item));
}

// =====================================================
// DTO
// =====================================================

export class ExportarTicketsReporteDto {
  // ===================================================
  // PERÍODO
  // ===================================================

  /**
   * Fecha calendario inicial.
   *
   * Ejemplo:
   * 2026-08-01
   *
   * El caso de uso será responsable de convertirla
   * posteriormente al inicio del día en Guatemala.
   */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaDesde debe utilizar el formato YYYY-MM-DD',
  })
  @IsDateString(
    {
      strict: true,
    },
    {
      message: 'fechaDesde debe ser una fecha válida',
    },
  )
  fechaDesde?: string;

  /**
   * Fecha calendario final inclusiva solicitada.
   *
   * Ejemplo:
   * 2026-08-31
   *
   * El caso de uso la transformará posteriormente
   * al inicio exclusivo del día siguiente.
   */
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'fechaHasta debe utilizar el formato YYYY-MM-DD',
  })
  @IsDateString(
    {
      strict: true,
    },
    {
      message: 'fechaHasta debe ser una fecha válida',
    },
  )
  fechaHasta?: string;

  @IsOptional()
  @IsEnum(TicketReporteAgrupacion, {
    message: 'agrupacion debe ser AUTO, DIA, SEMANA o MES',
  })
  agrupacion?: TicketReporteAgrupacionType;

  // ===================================================
  // TICKET
  // ===================================================

  @IsOptional()
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @IsEnum(TicketReporteEstado, {
    each: true,
    message: 'Cada estado debe ser un estado de ticket válido',
  })
  estados?: TicketReporteEstadoType[];

  @IsOptional()
  @Transform(({ value }) => normalizeStringArray(value))
  @IsArray()
  @IsEnum(TicketReportePrioridad, {
    each: true,
    message: 'Cada prioridad debe ser una prioridad válida',
  })
  prioridades?: TicketReportePrioridadType[];

  // ===================================================
  // RELACIONES
  // ===================================================

  /**
   * El ticket coincide si posee cualquiera de
   * las etiquetas solicitadas.
   */
  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada etiquetaId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada etiquetaId debe ser mayor que cero',
  })
  etiquetaIds?: number[];

  /**
   * Participación como:
   *
   * - técnico principal
   * - técnico de apoyo
   */
  @IsOptional()
  @Transform(({ value }) => normalizeNumberArray(value))
  @IsArray()
  @IsInt({
    each: true,
    message: 'Cada tecnicoId debe ser un entero',
  })
  @Min(1, {
    each: true,
    message: 'Cada tecnicoId debe ser mayor que cero',
  })
  tecnicoIds?: number[];

  @IsOptional()
  @Type(() => Number)
  @IsInt({
    message: 'clienteId debe ser un entero',
  })
  @Min(1, {
    message: 'clienteId debe ser mayor que cero',
  })
  clienteId?: number;
}
