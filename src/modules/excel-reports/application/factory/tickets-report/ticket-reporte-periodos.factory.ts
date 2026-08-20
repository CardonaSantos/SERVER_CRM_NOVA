import { BadRequestException } from '@nestjs/common';
import type { Dayjs } from 'dayjs';
import {
  TicketReporteAgrupacion,
  TicketReporteAgrupacionEfectiva,
} from 'src/modules/excel-reports/domain/enums/ticket-report/ticket-reporte-agrupacion.enum';
import { TicketReporteFilters } from 'src/modules/excel-reports/domain/filters/ticket-reporte/tickets-query-filters';
import { dayjs } from 'src/Utils/dayjs.config';
import { TZ } from 'src/Utils/tzgt';

// MODELOS INTERNOS

export interface TicketReporteRangoNormalizado {
  desdeInclusivo: Date;
  hastaExclusivo: Date;

  agrupacionSolicitada: TicketReporteAgrupacion;
  agrupacionEfectiva: TicketReporteAgrupacionEfectiva;
}

export interface TicketReportePeriodoBucket {
  periodo: string;
  etiqueta: string;

  desde: Date;
  hastaExclusivo: Date;
}

// FACTORY

export class TicketReportePeriodosFactory {
  /**
   * Normaliza el rango solicitado.
   *
   * - fechaDesde es inclusiva;
   * - fechaHasta es inclusiva para el usuario;
   */
  static normalizar(
    filters: TicketReporteFilters,
    now: Date = new Date(),
  ): TicketReporteRangoNormalizado {
    const tieneDesde = Boolean(filters.fechaDesde);
    const tieneHasta = Boolean(filters.fechaHasta);

    if (tieneDesde !== tieneHasta) {
      throw new BadRequestException(
        'fechaDesde y fechaHasta deben enviarse juntas.',
      );
    }

    let desde: Dayjs;
    let hastaExclusivo: Dayjs;

    if (filters.fechaDesde && filters.fechaHasta) {
      desde = dayjs(filters.fechaDesde).tz(TZ).startOf('day');

      const hastaInclusivo = dayjs(filters.fechaHasta).tz(TZ).startOf('day');

      if (hastaInclusivo.isBefore(desde)) {
        throw new BadRequestException(
          'fechaHasta no puede ser anterior a fechaDesde.',
        );
      }

      hastaExclusivo = hastaInclusivo.add(1, 'day');
    } else {
      const ahoraGT = dayjs(now).tz(TZ);

      desde = ahoraGT.startOf('month');

      hastaExclusivo = desde.add(1, 'month');
    }

    const agrupacionSolicitada =
      filters.agrupacion ?? TicketReporteAgrupacion.AUTO;

    const agrupacionEfectiva = this.resolverAgrupacion(
      agrupacionSolicitada,
      desde,
      hastaExclusivo,
    );

    return {
      desdeInclusivo: desde.toDate(),
      hastaExclusivo: hastaExclusivo.toDate(),

      agrupacionSolicitada,
      agrupacionEfectiva,
    };
  }

  /**
   * Construye todos los buckets necesarios para
   * la hoja "02 Periodo".
   */
  static crearBuckets(
    rango: TicketReporteRangoNormalizado,
  ): TicketReportePeriodoBucket[] {
    const desde = dayjs(rango.desdeInclusivo).tz(TZ);

    const hastaExclusivo = dayjs(rango.hastaExclusivo).tz(TZ);

    switch (rango.agrupacionEfectiva) {
      case TicketReporteAgrupacion.DIA:
        return this.crearBucketsDiarios(desde, hastaExclusivo);

      case TicketReporteAgrupacion.SEMANA:
        return this.crearBucketsSemanales(desde, hastaExclusivo);

      case TicketReporteAgrupacion.MES:
        return this.crearBucketsMensuales(desde, hastaExclusivo);
    }
  }

  // AUTO

  private static resolverAgrupacion(
    solicitada: TicketReporteAgrupacion,
    desde: Dayjs,
    hastaExclusivo: Dayjs,
  ): TicketReporteAgrupacionEfectiva {
    if (solicitada !== TicketReporteAgrupacion.AUTO) {
      return solicitada;
    }

    const dias = hastaExclusivo.diff(desde, 'day');

    /**
     *
     * hasta 31 días     -> DIA
     * hasta 120 días    -> SEMANA
     * más de 120 días   -> MES
     *
     * De esta forma el mes actual, que es el default,
     * obtiene detalle diario sin producir hojas
     * excesivamente grandes para períodos largos.
     */
    if (dias <= 31) {
      return TicketReporteAgrupacion.DIA;
    }

    if (dias <= 120) {
      return TicketReporteAgrupacion.SEMANA;
    }

    return TicketReporteAgrupacion.MES;
  }

  // DÍA

  private static crearBucketsDiarios(
    desde: Dayjs,
    hastaExclusivo: Dayjs,
  ): TicketReportePeriodoBucket[] {
    const buckets: TicketReportePeriodoBucket[] = [];

    let cursor = desde;

    while (cursor.isBefore(hastaExclusivo)) {
      const siguiente = this.min(cursor.add(1, 'day'), hastaExclusivo);

      buckets.push({
        periodo: cursor.format('YYYY-MM-DD'),

        etiqueta: this.formatDia(cursor),

        desde: cursor.toDate(),
        hastaExclusivo: siguiente.toDate(),
      });

      cursor = siguiente;
    }

    return buckets;
  }

  // SEMANA

  private static crearBucketsSemanales(
    desde: Dayjs,
    hastaExclusivo: Dayjs,
  ): TicketReportePeriodoBucket[] {
    const buckets: TicketReportePeriodoBucket[] = [];

    let cursor = desde;

    while (cursor.isBefore(hastaExclusivo)) {
      const inicioSemanaReal = this.inicioSemanaIso(cursor);

      const finSemanaReal = inicioSemanaReal.add(7, 'day');

      const siguiente = this.min(finSemanaReal, hastaExclusivo);

      const numeroSemana = String(inicioSemanaReal.isoWeek()).padStart(2, '0');

      const anioSemana = inicioSemanaReal.isoWeekYear();

      buckets.push({
        periodo: `${anioSemana}-W${numeroSemana}`,

        etiqueta: this.formatRango(cursor, siguiente),

        desde: cursor.toDate(),

        hastaExclusivo: siguiente.toDate(),
      });

      cursor = siguiente;
    }

    return buckets;
  }

  // MES

  private static crearBucketsMensuales(
    desde: Dayjs,
    hastaExclusivo: Dayjs,
  ): TicketReportePeriodoBucket[] {
    const buckets: TicketReportePeriodoBucket[] = [];

    let cursor = desde;

    while (cursor.isBefore(hastaExclusivo)) {
      const inicioMesReal = cursor.startOf('month');

      const finMesReal = inicioMesReal.add(1, 'month');

      const siguiente = this.min(finMesReal, hastaExclusivo);

      buckets.push({
        periodo: cursor.format('YYYY-MM'),

        etiqueta: this.formatMes(cursor),

        desde: cursor.toDate(),

        hastaExclusivo: siguiente.toDate(),
      });

      cursor = siguiente;
    }

    return buckets;
  }

  // HELPERS

  /**
   * ISO week:
   *
   * lunes = inicio
   * domingo = final
   *
   * Se calcula manualmente para no depender
   * de mutaciones adicionales de Dayjs.
   */
  private static inicioSemanaIso(date: Dayjs): Dayjs {
    const day = date.day();

    const diasDesdeLunes = (day + 6) % 7;

    return date.subtract(diasDesdeLunes, 'day').startOf('day');
  }

  private static min(a: Dayjs, b: Dayjs): Dayjs {
    return a.isBefore(b) ? a : b;
  }

  private static formatDia(date: Dayjs): string {
    return new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: TZ,
    }).format(date.toDate());
  }

  private static formatMes(date: Dayjs): string {
    const value = new Intl.DateTimeFormat('es-GT', {
      month: 'long',
      year: 'numeric',
      timeZone: TZ,
    }).format(date.toDate());

    return value.replace(/^./, (char) => char.toUpperCase());
  }

  private static formatRango(desde: Dayjs, hastaExclusivo: Dayjs): string {
    const ultimoDia = hastaExclusivo.subtract(1, 'day');

    const formatter = new Intl.DateTimeFormat('es-GT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: TZ,
    });

    return `${formatter.format(desde.toDate())} – ${formatter.format(
      ultimoDia.toDate(),
    )}`;
  }
}
