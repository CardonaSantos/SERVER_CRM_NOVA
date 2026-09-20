import { FacturacionReporteEstadoFactura } from '../../../domain/enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import {
  FacturacionReporteEvolucion,
  FacturacionReporteEvolucionFacturacionRow,
  FacturacionReporteEvolucionRecaudacionRow,
  FacturacionReporteRecuperacionCohorteRow,
} from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-evolucion';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionReportePeriodo } from '../../factory/facturacion-report/facturacion-reporte-periodos.factory';

import { FacturacionReporteMoneyHelper as Money } from './facturacion-reporte-money.helper';

export interface FacturacionReporteEvolucionBuilderInput {
  facturas: FacturaReporteRow[];

  pagosRegistrados: PagoReporteRow[];

  pagosCohorte: PagoReporteRow[];

  periodos: FacturacionReportePeriodo[];

  fechaCorte: Date;
}

export class FacturacionReporteEvolucionBuilder {
  static build(
    input: FacturacionReporteEvolucionBuilderInput,
  ): FacturacionReporteEvolucion {
    return {
      facturacionMensual: this.buildFacturacionMensual(
        input.facturas,
        input.periodos,
      ),

      recaudacionMensual: this.buildRecaudacionMensual(
        input.pagosRegistrados,
        input.periodos,
      ),

      recuperacionCohortes: this.buildRecuperacionCohortes(
        input.facturas,
        input.pagosCohorte,
        input.periodos,
        input.fechaCorte,
      ),
    };
  }

  // FACTURACIÓN POR PERÍODO

  private static buildFacturacionMensual(
    facturas: FacturaReporteRow[],
    periodos: FacturacionReportePeriodo[],
  ): FacturacionReporteEvolucionFacturacionRow[] {
    return periodos.map((periodo) => {
      const facturasPeriodo = facturas.filter(
        (factura) => factura.periodo === periodo.periodo,
      );

      const vigentes = facturasPeriodo.filter(
        (factura) => factura.estado !== FacturacionReporteEstadoFactura.ANULADA,
      );

      const totalCents = this.sumMonto(vigentes);

      const saldoCents = this.sumSaldo(vigentes);

      const cubiertoCents = totalCents - saldoCents;

      return {
        periodo: periodo.periodo,

        etiqueta: periodo.etiqueta,

        facturasEmitidas: vigentes.length,

        facturasAnuladas: facturasPeriodo.length - vigentes.length,

        facturado: Money.fromCents(totalCents),

        cubiertoActual: Money.fromCents(cubiertoCents),

        saldoPendienteActual: Money.fromCents(saldoCents),

        porcentajeCubiertoActual: Money.percentage(cubiertoCents, totalCents),
      };
    });
  }

  // RECAUDACIÓN POR MES DE PAGO

  private static buildRecaudacionMensual(
    pagos: PagoReporteRow[],
    periodos: FacturacionReportePeriodo[],
  ): FacturacionReporteEvolucionRecaudacionRow[] {
    return periodos.map((periodo) => {
      const desdeMs = periodo.desdeInclusivo.getTime();

      const hastaMs = periodo.hastaExclusivo.getTime();

      const pagosPeriodo = pagos.filter((pago) => {
        const fechaMs = pago.fechaPago.getTime();

        return fechaMs >= desdeMs && fechaMs < hastaMs;
      });

      const totalCents = pagosPeriodo.reduce(
        (total, pago) => total + Money.toCents(pago.montoPagado),
        0,
      );

      return {
        periodo: periodo.periodo,

        etiqueta: periodo.etiqueta,

        pagosRegistrados: pagosPeriodo.length,

        clientesQuePagaron: new Set(pagosPeriodo.map((pago) => pago.clienteId))
          .size,

        recaudado: Money.fromCents(totalCents),

        pagoPromedio: Money.average(totalCents, pagosPeriodo.length),
      };
    });
  }

  // RECUPERACIÓN POR COHORTE

  private static buildRecuperacionCohortes(
    facturas: FacturaReporteRow[],
    pagos: PagoReporteRow[],
    periodos: FacturacionReportePeriodo[],
    fechaCorte: Date,
  ): FacturacionReporteRecuperacionCohorteRow[] {
    const pagosPorFactura = this.groupPagosPorFactura(pagos);

    const fechaCorteMs = fechaCorte.getTime();

    return periodos.map((periodo) => {
      const facturasPeriodo = facturas.filter(
        (factura) =>
          factura.periodo === periodo.periodo &&
          factura.estado !== FacturacionReporteEstadoFactura.ANULADA,
      );

      const montoFacturadoCents = this.sumMonto(facturasPeriodo);

      const saldoActualCents = this.sumSaldo(facturasPeriodo);

      const cubiertoActualCents = montoFacturadoCents - saldoActualCents;

      const vencimiento = this.buildRecoveryPoint(
        facturasPeriodo,
        pagosPorFactura,
        fechaCorteMs,
        0,
      );

      const dias30 = this.buildRecoveryPoint(
        facturasPeriodo,
        pagosPorFactura,
        fechaCorteMs,
        30,
      );

      const dias60 = this.buildRecoveryPoint(
        facturasPeriodo,
        pagosPorFactura,
        fechaCorteMs,
        60,
      );

      return {
        periodo: periodo.periodo,

        etiqueta: periodo.etiqueta,

        facturas: facturasPeriodo.length,

        montoFacturado: Money.fromCents(montoFacturadoCents),

        cubiertoActual: Money.fromCents(cubiertoActualCents),

        saldoPendienteActual: Money.fromCents(saldoActualCents),

        porcentajeRecuperadoActual: Money.percentage(
          cubiertoActualCents,
          montoFacturadoCents,
        ),

        // VENCIMIENTO

        facturasElegiblesAlVencimiento: vencimiento.facturasElegibles,

        montoElegibleAlVencimiento: Money.fromCents(
          vencimiento.montoElegibleCents,
        ),

        recuperadoAlVencimiento: Money.fromCents(vencimiento.recuperadoCents),

        porcentajeRecuperadoAlVencimiento: Money.percentage(
          vencimiento.recuperadoCents,
          vencimiento.montoElegibleCents,
        ),

        // +30

        facturasElegibles30Dias: dias30.facturasElegibles,

        montoElegible30Dias: Money.fromCents(dias30.montoElegibleCents),

        recuperado30Dias: Money.fromCents(dias30.recuperadoCents),

        porcentajeRecuperado30Dias: Money.percentage(
          dias30.recuperadoCents,
          dias30.montoElegibleCents,
        ),

        // +60

        facturasElegibles60Dias: dias60.facturasElegibles,

        montoElegible60Dias: Money.fromCents(dias60.montoElegibleCents),

        recuperado60Dias: Money.fromCents(dias60.recuperadoCents),

        porcentajeRecuperado60Dias: Money.percentage(
          dias60.recuperadoCents,
          dias60.montoElegibleCents,
        ),
      };
    });
  }

  // RECOVERY POINT

  private static buildRecoveryPoint(
    facturas: FacturaReporteRow[],

    pagosPorFactura: Map<number, PagoReporteRow[]>,

    fechaCorteMs: number,

    diasDespuesVencimiento: number,
  ): {
    facturasElegibles: number;

    montoElegibleCents: number;

    recuperadoCents: number;
  } {
    let facturasElegibles = 0;

    let montoElegibleCents = 0;

    let recuperadoCents = 0;

    for (const factura of facturas) {
      if (!factura.fechaPagoEsperada) {
        continue;
      }

      const limiteMs =
        factura.fechaPagoEsperada.getTime() +
        diasDespuesVencimiento * 24 * 60 * 60 * 1000;

      /**
       * Todavía no ha llegado ese punto
       * de maduración de la factura.
       */
      if (limiteMs > fechaCorteMs) {
        continue;
      }

      facturasElegibles += 1;

      const montoFacturaCents = Money.toCents(factura.montoFactura);

      montoElegibleCents += montoFacturaCents;

      const pagosFactura = pagosPorFactura.get(factura.facturaId) ?? [];

      const pagadoHastaLimiteCents = pagosFactura
        .filter((pago) => pago.fechaPago.getTime() <= limiteMs)
        .reduce((total, pago) => total + Money.toCents(pago.montoPagado), 0);

      /**
       * La recuperación de una obligación
       * no puede superar el importe facturado,
       * aunque existan pagos superiores por
       * datos legacy o sobrepago.
       */
      recuperadoCents += Math.min(pagadoHastaLimiteCents, montoFacturaCents);
    }

    return {
      facturasElegibles,

      montoElegibleCents,

      recuperadoCents,
    };
  }

  // HELPERS

  private static groupPagosPorFactura(
    pagos: PagoReporteRow[],
  ): Map<number, PagoReporteRow[]> {
    const map = new Map<number, PagoReporteRow[]>();

    for (const pago of pagos) {
      const existing = map.get(pago.facturaInternetId);

      if (existing) {
        existing.push(pago);

        continue;
      }

      map.set(pago.facturaInternetId, [pago]);
    }

    return map;
  }

  private static sumMonto(facturas: FacturaReporteRow[]): number {
    return facturas.reduce(
      (total, factura) => total + Money.toCents(factura.montoFactura),
      0,
    );
  }

  private static sumSaldo(facturas: FacturaReporteRow[]): number {
    return facturas.reduce(
      (total, factura) => total + Money.toCents(factura.saldoPendiente),
      0,
    );
  }
}
