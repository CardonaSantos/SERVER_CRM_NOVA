import { EstadoTicketSoporte, PrioridadTicketSoporte } from '@prisma/client';
import {
  IsArray,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
} from 'class-validator';

export type ModoFechaTicketReport =
  | 'ACTIVIDAD'
  | 'APERTURA'
  | 'CIERRE'
  | 'ACTUALIZACION';

/** Body de POST /generate-reports/tickets/diario (validadores: etapa 8). */
export class QueryTicketsDailyReportDto {
  /**
   * Atajo para reporte de un solo día.
   * Ejemplo: "2026-05-21"
   */
  @IsOptional()
  @IsString()
  fecha?: string;

  /**
   * Para rango personalizado.
   */
  @IsOptional()
  @IsString()
  fechaInicio?: string;

  @IsOptional()
  @IsString()
  fechaFin?: string;

  @IsOptional()
  @IsInt()
  empresaId?: number;

  @IsOptional()
  @IsInt()
  tecnicoId?: number;

  @IsOptional()
  @IsArray()
  @IsEnum(EstadoTicketSoporte, { each: true })
  estados?: EstadoTicketSoporte[];

  @IsOptional()
  @IsArray()
  @IsEnum(PrioridadTicketSoporte, { each: true })
  prioridades?: PrioridadTicketSoporte[];

  /**
   * ACTIVIDAD:
   * toma tickets creados, cerrados, resueltos, actualizados,
   * con seguimiento o asignación dentro del rango.
   *
   * Default: ACTIVIDAD
   */
  @IsOptional()
  @IsIn(['ACTIVIDAD', 'APERTURA', 'CIERRE', 'ACTUALIZACION'])
  modoFecha?: ModoFechaTicketReport;
}
