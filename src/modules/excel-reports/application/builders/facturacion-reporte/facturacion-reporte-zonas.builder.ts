import { dayjs } from 'src/Utils/dayjs.config';

import { TZ } from 'src/Utils/tzgt';

import { FacturacionReporteEstadoFactura } from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteZonaFacturacionRow,
  FacturacionReporteZonaProyeccionRow,
  FacturacionReporteZonaRecaudacionRow,
  FacturacionReporteZonas,
} from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-zonas';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionProyeccionClienteRow } from '../../../domain/read-models/facturacion-reporte/facturacion-proyeccion-cliente-row';

import { FacturacionReportePeriodo } from '../../factory/facturacion-report/facturacion-reporte-periodos.factory';

import { FacturacionReporteMoneyHelper as Money } from './facturacion-reporte-money.helper';

export interface FacturacionReporteZonasBuilderInput {
  facturas: FacturaReporteRow[];

  pagosRegistrados: PagoReporteRow[];

  clientesProyeccion: FacturacionProyeccionClienteRow[];

  facturasProyeccionExistentes: FacturaReporteRow[];

  mesesGeneracionProyeccion: FacturacionReportePeriodo[];

  fechaCorte: Date;
}

export class FacturacionReporteZonasBuilder {
  static build(
    input: FacturacionReporteZonasBuilderInput,
  ): FacturacionReporteZonas {
    return {
      facturacion: this.buildFacturacionPorZona(input.facturas),

      recaudacion: this.buildRecaudacionPorZona(input.pagosRegistrados),

      proyeccion: this.buildProyeccionPorZona(
        input.clientesProyeccion,
        input.facturasProyeccionExistentes,
        input.mesesGeneracionProyeccion,
        input.fechaCorte,
      ),
    };
  }

  // FACTURACIÓN POR ZONA

  private static buildFacturacionPorZona(
    facturas: FacturaReporteRow[],
  ): FacturacionReporteZonaFacturacionRow[] {
    interface Accumulator {
      facturacionZonaId: number | null;

      zona: string;

      facturasEmitidas: number;

      facturasAnuladas: number;

      clienteIds: Set<number>;

      facturadoCents: number;

      cubiertoCents: number;

      saldoCents: number;
    }

    const map = new Map<string, Accumulator>();

    for (const factura of facturas) {
      const key = this.buildZonaKey(factura.facturacionZonaId);

      let item = map.get(key);

      if (!item) {
        item = {
          facturacionZonaId: factura.facturacionZonaId,

          zona: factura.facturacionZonaNombre ?? 'Sin zona',

          facturasEmitidas: 0,

          facturasAnuladas: 0,

          clienteIds: new Set<number>(),

          facturadoCents: 0,

          cubiertoCents: 0,

          saldoCents: 0,
        };

        map.set(key, item);
      }

      if (factura.estado === FacturacionReporteEstadoFactura.ANULADA) {
        item.facturasAnuladas += 1;

        continue;
      }

      const montoCents = Money.toCents(factura.montoFactura);

      const saldoCents = Money.toCents(factura.saldoPendiente);

      item.facturasEmitidas += 1;

      item.clienteIds.add(factura.clienteId);

      item.facturadoCents += montoCents;

      item.saldoCents += saldoCents;

      item.cubiertoCents += montoCents - saldoCents;
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.facturadoCents - a.facturadoCents ||
          a.zona.localeCompare(b.zona, 'es'),
      )
      .map((item) => ({
        facturacionZonaId: item.facturacionZonaId,

        zona: item.zona,

        facturasEmitidas: item.facturasEmitidas,

        facturasAnuladas: item.facturasAnuladas,

        clientesFacturados: item.clienteIds.size,

        facturado: Money.fromCents(item.facturadoCents),

        montoCubiertoActual: Money.fromCents(item.cubiertoCents),

        saldoPendienteActual: Money.fromCents(item.saldoCents),

        porcentajeCubiertoActual: Money.percentage(
          item.cubiertoCents,
          item.facturadoCents,
        ),
      }));
  }

  // RECAUDACIÓN POR ZONA

  private static buildRecaudacionPorZona(
    pagos: PagoReporteRow[],
  ): FacturacionReporteZonaRecaudacionRow[] {
    interface Accumulator {
      facturacionZonaId: number | null;

      zona: string;

      pagosRegistrados: number;

      clienteIds: Set<number>;

      recaudadoCents: number;
    }

    const map = new Map<string, Accumulator>();

    for (const pago of pagos) {
      const key = this.buildZonaKey(pago.facturacionZonaId);

      let item = map.get(key);

      if (!item) {
        item = {
          facturacionZonaId: pago.facturacionZonaId,

          zona: pago.facturacionZonaNombre ?? 'Sin zona',

          pagosRegistrados: 0,

          clienteIds: new Set<number>(),

          recaudadoCents: 0,
        };

        map.set(key, item);
      }

      item.pagosRegistrados += 1;

      item.clienteIds.add(pago.clienteId);

      item.recaudadoCents += Money.toCents(pago.montoPagado);
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.recaudadoCents - a.recaudadoCents ||
          a.zona.localeCompare(b.zona, 'es'),
      )
      .map((item) => ({
        facturacionZonaId: item.facturacionZonaId,

        zona: item.zona,

        pagosRegistrados: item.pagosRegistrados,

        clientesQuePagaron: item.clienteIds.size,

        recaudado: Money.fromCents(item.recaudadoCents),

        pagoPromedio: Money.average(item.recaudadoCents, item.pagosRegistrados),
      }));
  }

  // PROYECCIÓN POR ZONA

  private static buildProyeccionPorZona(
    clientes: FacturacionProyeccionClienteRow[],

    facturasExistentes: FacturaReporteRow[],

    mesesGeneracion: FacturacionReportePeriodo[],

    fechaCorte: Date,
  ): FacturacionReporteZonaProyeccionRow[] {
    interface ZonaAccumulator {
      facturacionZonaId: number;

      zona: string;

      diaGeneracionFactura: number;

      diaPago: number;

      clientes: Map<number, FacturacionProyeccionClienteRow>;

      potencialCents: number;
    }

    const zonas = new Map<number, ZonaAccumulator>();

    // ===================================================
    // CARTERA ACTUAL POR ZONA
    // ===================================================

    for (const cliente of clientes) {
      let zona = zonas.get(cliente.facturacionZonaId);

      if (!zona) {
        zona = {
          facturacionZonaId: cliente.facturacionZonaId,

          zona: cliente.facturacionZonaNombre,

          diaGeneracionFactura: cliente.diaGeneracionFactura,

          diaPago: cliente.diaPago,

          clientes: new Map(),

          potencialCents: 0,
        };

        zonas.set(cliente.facturacionZonaId, zona);
      }

      /**
       * ClienteInternet es único.
       *
       * No queremos duplicar potencial si por
       * algún error upstream llega dos veces.
       */
      if (zona.clientes.has(cliente.clienteId)) {
        continue;
      }

      zona.clientes.set(cliente.clienteId, cliente);

      zona.potencialCents += Money.toCents(cliente.precioMensual);
    }

    // ===================================================
    // FACTURAS EXISTENTES INDEXADAS POR CLAVE DE NEGOCIO
    // ===================================================

    const existentes = new Map<string, FacturaReporteRow>();

    for (const factura of facturasExistentes) {
      if (factura.facturacionZonaId === null) {
        continue;
      }

      const key = this.buildFacturaProyeccionKey(
        factura.clienteId,
        factura.facturacionZonaId,
        factura.periodo,
      );

      /**
       * El schema posee unique:
       *
       * clienteId + facturacionZonaId + periodo
       *
       * Si por una inconsistencia aparecieran dos,
       * conservar la primera no debe alterar la
       * proyección silenciosamente.
       */
      if (existentes.has(key)) {
        throw new Error(
          `Existe más de una factura para cliente ${factura.clienteId}, zona ${factura.facturacionZonaId}, periodo ${factura.periodo}.`,
        );
      }

      existentes.set(key, factura);
    }

    // ===================================================
    // EVENTOS FUTUROS
    // ===================================================

    const result: FacturacionReporteZonaProyeccionRow[] = [];

    const fechaCorteMs = fechaCorte.getTime();

    for (const zona of zonas.values()) {
      for (const mesGeneracion of mesesGeneracion) {
        const fechaGeneracion = this.buildFechaGeneracionDesdePeriodo(
          mesGeneracion.periodo,
          zona.diaGeneracionFactura,
        );

        /**
         * Ejemplo:
         *
         * diaGeneracionFactura = 31
         * febrero
         *
         * No existe evento de cron.
         */
        if (!fechaGeneracion) {
          continue;
        }

        /**
         * Sólo eventos realmente futuros.
         *
         * Esto permite conservar generaciones
         * pendientes del mes actual.
         */
        if (fechaGeneracion.getTime() <= fechaCorteMs) {
          continue;
        }

        const periodoObjetivo = this.calcularPeriodoGenerado(
          fechaGeneracion,
          zona.diaPago,
        );

        const fechaPago = this.resolveFechaPagoPeriodo(
          periodoObjetivo,
          zona.diaPago,
        );

        let facturasYaExistentes = 0;

        let facturasAnuladasExistentes = 0;

        let montoYaEmitidoCents = 0;

        let clientesProyectados = 0;

        let montoProyectadoCents = 0;

        for (const cliente of zona.clientes.values()) {
          const key = this.buildFacturaProyeccionKey(
            cliente.clienteId,
            zona.facturacionZonaId,
            periodoObjetivo,
          );

          const existente = existentes.get(key);

          if (existente) {
            facturasYaExistentes += 1;

            if (existente.estado === FacturacionReporteEstadoFactura.ANULADA) {
              facturasAnuladasExistentes += 1;
            } else {
              montoYaEmitidoCents += Money.toCents(existente.montoFactura);
            }

            /**
             * Aunque esté ANULADA existe una fila
             * con la clave unique.
             *
             * No la presentamos como pendiente de
             * una creación nueva.
             */
            continue;
          }

          clientesProyectados += 1;

          montoProyectadoCents += Money.toCents(cliente.precioMensual);
        }

        result.push({
          facturacionZonaId: zona.facturacionZonaId,

          zona: zona.zona,

          periodo: periodoObjetivo,

          etiqueta: this.formatPeriodoLabel(periodoObjetivo),

          diaGeneracionFactura: zona.diaGeneracionFactura,

          diaPago: zona.diaPago,

          fechaGeneracionProgramada: fechaGeneracion,

          fechaPagoProgramada: fechaPago,

          clientesFacturablesActuales: zona.clientes.size,

          potencialMensualActual: Money.fromCents(zona.potencialCents),

          facturasYaExistentes,

          facturasAnuladasExistentes,

          montoYaEmitidoVigente: Money.fromCents(montoYaEmitidoCents),

          clientesProyectados,

          montoProyectado: Money.fromCents(montoProyectadoCents),
        });
      }
    }

    return result.sort(
      (a, b) =>
        a.fechaGeneracionProgramada.getTime() -
          b.fechaGeneracionProgramada.getTime() ||
        a.zona.localeCompare(b.zona, 'es'),
    );
  }

  // GENERACIÓN DE CICLO

  private static buildFechaGeneracion(
    year: number,
    month: number,
    day: number,
  ): Date | null {
    const anchor = dayjs.tz(`${year}-${String(month).padStart(2, '0')}-01`, TZ);

    const lastDay = anchor.daysInMonth();

    /**
     * El cron actual no clampa diaGeneracionFactura.
     *
     * Si está configurado 31 y el mes posee 30 días,
     * ese mes no tendrá evento de generación.
     */
    if (day < 1 || day > lastDay) {
      return null;
    }

    return anchor
      .date(day)
      .hour(10)
      .minute(0)
      .second(0)
      .millisecond(0)
      .toDate();
  }

  private static buildFacturaProyeccionKey(
    clienteId: number,
    facturacionZonaId: number,
    periodo: string,
  ): string {
    return [clienteId, facturacionZonaId, periodo].join(':');
  }

  private static buildFechaGeneracionDesdePeriodo(
    periodoGeneracion: string,
    diaGeneracionFactura: number,
  ): Date | null {
    const year = Number(periodoGeneracion.slice(0, 4));

    const month = Number(periodoGeneracion.slice(4, 6));

    return this.buildFechaGeneracion(year, month, diaGeneracionFactura);
  }

  private static formatPeriodoLabel(periodo: string): string {
    const year = periodo.slice(0, 4);

    const month = periodo.slice(4, 6);

    const date = dayjs.tz(`${year}-${month}-01`, TZ);

    const text = date.format('MMMM YYYY');

    return text.charAt(0).toUpperCase() + text.slice(1);
  }

  private static calcularPeriodoGenerado(
    fechaGeneracion: Date,
    diaPago: number,
  ): string {
    const generation = dayjs(fechaGeneracion).tz(TZ);

    const ultimoDiaMes = generation.daysInMonth();

    /**
     * El día de pago sí se ajusta al último
     * día disponible del mes.
     */
    const diaPagoValido = Math.min(diaPago, ultimoDiaMes);

    const fechaPagoBase = generation.date(diaPagoValido).startOf('day');

    const fechaReferencia = fechaPagoBase.isBefore(generation, 'day')
      ? fechaPagoBase.add(1, 'month')
      : fechaPagoBase;

    return fechaReferencia.format('YYYYMM');
  }

  // FECHA DE PAGO DEL PERÍODO

  private static resolveFechaPagoPeriodo(
    periodo: string,
    diaPago: number,
  ): Date {
    const year = Number(periodo.slice(0, 4));

    const month = Number(periodo.slice(4, 6));

    const anchor = dayjs.tz(`${year}-${String(month).padStart(2, '0')}-01`, TZ);

    const diaPagoValido = Math.min(diaPago, anchor.daysInMonth());

    return anchor.date(diaPagoValido).startOf('day').toDate();
  }

  // KEY

  private static buildZonaKey(facturacionZonaId: number | null): string {
    return facturacionZonaId === null
      ? 'SIN_ZONA'
      : `ZONA:${facturacionZonaId}`;
  }
}
