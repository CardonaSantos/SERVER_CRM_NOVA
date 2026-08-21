import { BadRequestException } from '@nestjs/common';

import { dayjs } from 'src/Utils/dayjs.config';

import { TZ } from 'src/Utils/tzgt';

import { FacturacionReporteFilters } from '../../../domain/filters/facturacion-reporte/facturacion-reporte-filters';

// =====================================================
// READ MODELS DEL FACTORY
// =====================================================

export interface FacturacionReportePeriodo {
  periodo: string;

  etiqueta: string;

  desdeInclusivo: Date;

  hastaExclusivo: Date;
}

export interface FacturacionReporteRango {
  periodoDesde: string;

  periodoHasta: string;

  desdeInclusivo: Date;

  hastaExclusivo: Date;

  /**
   * Períodos históricos solicitados.
   */
  periodos: FacturacionReportePeriodo[];

  /**
   * Cantidad de meses completos hacia adelante
   * solicitados por el usuario.
   */
  mesesProyeccion: number;

  /**
   * Meses calendario donde pueden ocurrir
   * futuras ejecuciones del cron.
   *
   * Si mesesProyeccion = 3:
   *
   * - remanente del mes actual;
   * - siguiente mes;
   * - +2;
   * - +3.
   *
   * El builder será quien descarte eventos
   * del mes actual cuya hora ya pasó.
   */
  mesesGeneracionProyeccion: FacturacionReportePeriodo[];
}

// =====================================================
// FACTORY
// =====================================================

export class FacturacionReportePeriodosFactory {
  private static readonly DEFAULT_MESES_HISTORICO = 12;

  private static readonly MAX_MESES_HISTORICO = 120;

  private static readonly DEFAULT_MESES_PROYECCION = 3;

  private static readonly MAX_MESES_PROYECCION = 24;

  // ===================================================
  // NORMALIZAR
  // ===================================================

  static normalizar(
    filters: FacturacionReporteFilters,
    now: Date = new Date(),
  ): FacturacionReporteRango {
    const actual = dayjs(now).tz(TZ).startOf('month');

    const tieneDesde = Boolean(filters.periodoDesde);

    const tieneHasta = Boolean(filters.periodoHasta);

    if (tieneDesde !== tieneHasta) {
      throw new BadRequestException(
        'periodoDesde y periodoHasta deben enviarse juntos.',
      );
    }

    let periodoDesde: string;
    let periodoHasta: string;

    if (filters.periodoDesde && filters.periodoHasta) {
      periodoDesde = this.assertPeriodoValido(
        filters.periodoDesde,
        'periodoDesde',
      );

      periodoHasta = this.assertPeriodoValido(
        filters.periodoHasta,
        'periodoHasta',
      );
    } else {
      periodoHasta = actual.format('YYYYMM');

      periodoDesde = actual
        .subtract(this.DEFAULT_MESES_HISTORICO - 1, 'month')
        .format('YYYYMM');
    }

    const inicio = this.periodoToDayjs(periodoDesde);

    const fin = this.periodoToDayjs(periodoHasta);

    if (fin.isBefore(inicio, 'month')) {
      throw new BadRequestException(
        'periodoHasta no puede ser anterior a periodoDesde.',
      );
    }

    const cantidadMeses = fin.diff(inicio, 'month') + 1;

    if (cantidadMeses > this.MAX_MESES_HISTORICO) {
      throw new BadRequestException(
        `El rango no puede exceder ${this.MAX_MESES_HISTORICO} meses.`,
      );
    }

    const mesesProyeccion = this.normalizarMesesProyeccion(
      filters.mesesProyeccion,
    );

    return {
      periodoDesde,

      periodoHasta,

      desdeInclusivo: inicio.toDate(),

      hastaExclusivo: fin.add(1, 'month').startOf('month').toDate(),

      periodos: this.crearPeriodos(periodoDesde, periodoHasta),

      mesesProyeccion,

      mesesGeneracionProyeccion: this.crearMesesGeneracionProyeccion(
        actual.format('YYYYMM'),
        mesesProyeccion,
      ),
    };
  }

  // ===================================================
  // POSIBLES PERIODOS DE FACTURA DE LA PROYECCIÓN
  // ===================================================

  static crearPeriodosObjetivoPosibles(
    mesesGeneracion: FacturacionReportePeriodo[],
  ): string[] {
    const values = new Set<string>();

    for (const mes of mesesGeneracion) {
      const anchor = this.periodoToDayjs(mes.periodo);

      /**
       * Dependiendo de diaPago respecto de
       * diaGeneracionFactura, el cron puede generar:
       *
       * - el período del mismo mes;
       * - el período del mes siguiente.
       */
      values.add(anchor.format('YYYYMM'));

      values.add(anchor.add(1, 'month').format('YYYYMM'));
    }

    return [...values].sort();
  }

  // ===================================================
  // HISTÓRICO
  // ===================================================

  private static crearPeriodos(
    periodoDesde: string,
    periodoHasta: string,
  ): FacturacionReportePeriodo[] {
    const desde = this.periodoToDayjs(periodoDesde);

    const hasta = this.periodoToDayjs(periodoHasta);

    const result: FacturacionReportePeriodo[] = [];

    let current = desde;

    while (current.isBefore(hasta, 'month') || current.isSame(hasta, 'month')) {
      result.push(this.toPeriodo(current));

      current = current.add(1, 'month');
    }

    return result;
  }

  // ===================================================
  // MESES DONDE PUEDE EJECUTARSE EL CRON
  // ===================================================

  private static crearMesesGeneracionProyeccion(
    periodoActual: string,
    mesesProyeccion: number,
  ): FacturacionReportePeriodo[] {
    if (mesesProyeccion === 0) {
      return [];
    }

    const actual = this.periodoToDayjs(periodoActual);

    const result: FacturacionReportePeriodo[] = [];

    /**
     * Incluimos:
     *
     * i = 0 -> remanente del mes actual
     * i = 1..N -> meses futuros completos
     */
    for (let i = 0; i <= mesesProyeccion; i += 1) {
      result.push(this.toPeriodo(actual.add(i, 'month')));
    }

    return result;
  }

  // ===================================================
  // NORMALIZAR PROYECCIÓN
  // ===================================================

  private static normalizarMesesProyeccion(value?: number): number {
    const result = value ?? this.DEFAULT_MESES_PROYECCION;

    if (!Number.isInteger(result) || result < 0) {
      throw new BadRequestException(
        'mesesProyeccion debe ser un entero mayor o igual a cero.',
      );
    }

    if (result > this.MAX_MESES_PROYECCION) {
      throw new BadRequestException(
        `mesesProyeccion no puede exceder ${this.MAX_MESES_PROYECCION}.`,
      );
    }

    return result;
  }

  // ===================================================
  // PERÍODO
  // ===================================================

  private static assertPeriodoValido(value: string, field: string): string {
    if (!/^\d{6}$/.test(value)) {
      throw new BadRequestException(
        `${field} debe utilizar el formato YYYYMM.`,
      );
    }

    const month = Number(value.slice(4, 6));

    if (month < 1 || month > 12) {
      throw new BadRequestException(`${field} contiene un mes inválido.`);
    }

    return value;
  }

  private static periodoToDayjs(periodo: string) {
    const year = periodo.slice(0, 4);

    const month = periodo.slice(4, 6);

    return dayjs.tz(`${year}-${month}-01`, TZ);
  }

  private static toPeriodo(
    value: ReturnType<typeof dayjs>,
  ): FacturacionReportePeriodo {
    const inicio = value.tz(TZ).startOf('month');

    const text = inicio.format('MMMM YYYY');

    return {
      periodo: inicio.format('YYYYMM'),

      etiqueta: text.charAt(0).toUpperCase() + text.slice(1),

      desdeInclusivo: inicio.toDate(),

      hastaExclusivo: inicio.add(1, 'month').toDate(),
    };
  }
}
