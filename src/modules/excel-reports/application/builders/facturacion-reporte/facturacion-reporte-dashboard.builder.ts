import { dayjs } from 'src/Utils/dayjs.config';

import { TZ } from 'src/Utils/tzgt';

import { FacturacionReporteEstadoFactura } from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteDashboard,
  FacturacionReporteTopDeudor,
  FacturacionReporteTopPagador,
} from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-dashboard';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionProyeccionClienteRow } from '../../../domain/read-models/facturacion-reporte/facturacion-proyeccion-cliente-row';

import { FacturacionReportePeriodo } from '../../factory/facturacion-report/facturacion-reporte-periodos.factory';

import { FacturacionReporteMoneyHelper as Money } from './facturacion-reporte-money.helper';
import { FacturacionReporteZonaProyeccionRow } from 'src/modules/excel-reports/domain/read-models/facturacion-reporte/facturacion-reporte-zonas';

export interface FacturacionReporteDashboardBuilderInput {
  facturas: FacturaReporteRow[];

  pagosRegistrados: PagoReporteRow[];

  carteraPendiente: FacturaReporteRow[];

  proyeccionZonas: FacturacionReporteZonaProyeccionRow[];

  fechaCorte: Date;
}

export class FacturacionReporteDashboardBuilder {
  static build(
    input: FacturacionReporteDashboardBuilderInput,
  ): FacturacionReporteDashboard {
    const facturasVigentes = input.facturas.filter(
      (factura) => factura.estado !== FacturacionReporteEstadoFactura.ANULADA,
    );

    const facturasAnuladas = input.facturas.length - facturasVigentes.length;

    const totalFacturadoCents = this.sumFacturaMonto(facturasVigentes);

    const saldoFacturasCents = this.sumFacturaSaldo(facturasVigentes);

    const cubiertoActualCents = totalFacturadoCents - saldoFacturasCents;

    const totalRecaudadoCents = input.pagosRegistrados.reduce(
      (total, pago) => total + Money.toCents(pago.montoPagado),
      0,
    );

    const cuentasPorCobrarCents = this.sumFacturaSaldo(input.carteraPendiente);

    const { saldoVencidoCents, saldoPorVencerCents, saldoSinFechaCents } =
      this.buildCarteraTemporal(input.carteraPendiente, input.fechaCorte);

    return {
      facturacion: {
        facturasEmitidas: facturasVigentes.length,

        facturasAnuladas,

        totalFacturado: Money.fromCents(totalFacturadoCents),

        montoCubiertoActual: Money.fromCents(cubiertoActualCents),

        saldoPendienteActual: Money.fromCents(saldoFacturasCents),

        porcentajeCubiertoActual: Money.percentage(
          cubiertoActualCents,
          totalFacturadoCents,
        ),

        facturasConSaldoPendiente: facturasVigentes.filter(
          (factura) => factura.saldoPendiente > 0,
        ).length,

        facturasVencidasConSaldo: facturasVigentes.filter(
          (factura) =>
            factura.saldoPendiente > 0 &&
            this.esVencida(factura.fechaPagoEsperada, input.fechaCorte),
        ).length,
      },

      cobros: {
        pagosRegistrados: input.pagosRegistrados.length,

        clientesQuePagaron: new Set(
          input.pagosRegistrados.map((pago) => pago.clienteId),
        ).size,

        totalRecaudado: Money.fromCents(totalRecaudadoCents),

        pagoPromedio: Money.average(
          totalRecaudadoCents,
          input.pagosRegistrados.length,
        ),
      },

      cartera: {
        cuentasPorCobrar: Money.fromCents(cuentasPorCobrarCents),

        clientesConDeuda: new Set(
          input.carteraPendiente.map((factura) => factura.clienteId),
        ).size,

        facturasPendientes: input.carteraPendiente.length,

        saldoVencido: Money.fromCents(saldoVencidoCents),

        saldoPorVencer: Money.fromCents(saldoPorVencerCents),

        saldoSinFechaVencimiento: Money.fromCents(saldoSinFechaCents),
      },

      proyeccionMensual: this.buildProyeccion(input.proyeccionZonas),

      topPagadores: this.buildTopPagadores(input.pagosRegistrados),

      topDeudores: this.buildTopDeudores(
        input.carteraPendiente,
        input.fechaCorte,
      ),
    };
  }

  // PROYECCIÓN
  private static buildProyeccion(zonas: FacturacionReporteZonaProyeccionRow[]) {
    interface Accumulator {
      periodo: string;

      etiqueta: string;

      clientesProyectados: number;

      montoCents: number;
    }

    const map = new Map<string, Accumulator>();

    for (const zona of zonas) {
      let item = map.get(zona.periodo);

      if (!item) {
        item = {
          periodo: zona.periodo,

          etiqueta: zona.etiqueta,

          clientesProyectados: 0,

          montoCents: 0,
        };

        map.set(zona.periodo, item);
      }

      item.clientesProyectados += zona.clientesProyectados;

      item.montoCents += Money.toCents(zona.montoProyectado);
    }

    return [...map.values()]
      .sort((a, b) => a.periodo.localeCompare(b.periodo))
      .map((item) => ({
        periodo: item.periodo,

        etiqueta: item.etiqueta,

        clientesProyectados: item.clientesProyectados,

        montoProyectado: Money.fromCents(item.montoCents),
      }));
  }

  // TOP PAGADORES

  private static buildTopPagadores(
    pagos: PagoReporteRow[],
  ): FacturacionReporteTopPagador[] {
    interface Accumulator {
      clienteId: number;

      cliente: string;

      pagosRegistrados: number;

      facturaIds: Set<number>;

      totalCents: number;
    }

    const map = new Map<number, Accumulator>();

    for (const pago of pagos) {
      const existing = map.get(pago.clienteId);

      if (existing) {
        existing.pagosRegistrados += 1;

        existing.facturaIds.add(pago.facturaInternetId);

        existing.totalCents += Money.toCents(pago.montoPagado);

        continue;
      }

      map.set(pago.clienteId, {
        clienteId: pago.clienteId,

        cliente: pago.clienteNombre,

        pagosRegistrados: 1,

        facturaIds: new Set([pago.facturaInternetId]),

        totalCents: Money.toCents(pago.montoPagado),
      });
    }

    return [...map.values()]
      .sort((a, b) => b.totalCents - a.totalCents || a.clienteId - b.clienteId)
      .slice(0, 10)
      .map((item) => ({
        clienteId: item.clienteId,

        cliente: item.cliente,

        pagosRegistrados: item.pagosRegistrados,

        facturasConPago: item.facturaIds.size,

        totalPagado: Money.fromCents(item.totalCents),
      }));
  }

  // TOP DEUDORES

  private static buildTopDeudores(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): FacturacionReporteTopDeudor[] {
    interface Accumulator {
      clienteId: number;

      cliente: string;

      facturasPendientes: number;

      fechaMasAntigua: Date | null;

      totalCents: number;
    }

    const map = new Map<number, Accumulator>();

    for (const factura of facturas) {
      const existing = map.get(factura.clienteId);

      if (existing) {
        existing.facturasPendientes += 1;

        existing.totalCents += Money.toCents(factura.saldoPendiente);

        existing.fechaMasAntigua = this.minDate(
          existing.fechaMasAntigua,
          factura.fechaPagoEsperada,
        );

        continue;
      }

      map.set(factura.clienteId, {
        clienteId: factura.clienteId,

        cliente: factura.clienteNombreActual,

        facturasPendientes: 1,

        fechaMasAntigua: factura.fechaPagoEsperada,

        totalCents: Money.toCents(factura.saldoPendiente),
      });
    }

    return [...map.values()]
      .sort((a, b) => b.totalCents - a.totalCents || a.clienteId - b.clienteId)
      .slice(0, 10)
      .map((item) => ({
        clienteId: item.clienteId,

        cliente: item.cliente,

        facturasPendientes: item.facturasPendientes,

        fechaPagoEsperadaMasAntigua: item.fechaMasAntigua,

        diasMoraMaximos: this.calculateDiasMora(
          item.fechaMasAntigua,
          fechaCorte,
        ),

        totalPendiente: Money.fromCents(item.totalCents),
      }));
  }

  // CARTERA

  private static buildCarteraTemporal(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): {
    saldoVencidoCents: number;

    saldoPorVencerCents: number;

    saldoSinFechaCents: number;
  } {
    let saldoVencidoCents = 0;

    let saldoPorVencerCents = 0;

    let saldoSinFechaCents = 0;

    for (const factura of facturas) {
      const saldoCents = Money.toCents(factura.saldoPendiente);

      if (!factura.fechaPagoEsperada) {
        saldoSinFechaCents += saldoCents;

        continue;
      }

      if (this.esVencida(factura.fechaPagoEsperada, fechaCorte)) {
        saldoVencidoCents += saldoCents;
      } else {
        saldoPorVencerCents += saldoCents;
      }
    }

    return {
      saldoVencidoCents,

      saldoPorVencerCents,

      saldoSinFechaCents,
    };
  }

  // HELPERS

  private static sumFacturaMonto(facturas: FacturaReporteRow[]): number {
    return facturas.reduce(
      (total, factura) => total + Money.toCents(factura.montoFactura),
      0,
    );
  }

  private static sumFacturaSaldo(facturas: FacturaReporteRow[]): number {
    return facturas.reduce(
      (total, factura) => total + Money.toCents(factura.saldoPendiente),
      0,
    );
  }

  private static esVencida(
    fechaPagoEsperada: Date | null,
    fechaCorte: Date,
  ): boolean {
    if (!fechaPagoEsperada) {
      return false;
    }

    const esperada = dayjs(fechaPagoEsperada).tz(TZ).startOf('day');

    const corte = dayjs(fechaCorte).tz(TZ).startOf('day');

    return esperada.isBefore(corte, 'day');
  }

  private static calculateDiasMora(
    fechaPagoEsperada: Date | null,
    fechaCorte: Date,
  ): number | null {
    if (!fechaPagoEsperada) {
      return null;
    }

    const esperada = dayjs(fechaPagoEsperada).tz(TZ).startOf('day');

    const corte = dayjs(fechaCorte).tz(TZ).startOf('day');

    const diff = corte.diff(esperada, 'day');

    return Math.max(diff, 0);
  }

  private static minDate(
    current: Date | null,
    candidate: Date | null,
  ): Date | null {
    if (!current) {
      return candidate;
    }

    if (!candidate) {
      return current;
    }

    return candidate.getTime() < current.getTime() ? candidate : current;
  }
}
