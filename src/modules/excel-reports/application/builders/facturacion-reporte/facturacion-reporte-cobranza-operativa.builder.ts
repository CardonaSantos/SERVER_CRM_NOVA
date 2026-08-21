import { FacturacionReporteOrigenPago } from '../../../domain/enums/facturacion-report/facturacion-reporte-origen-pago.enum';

import {
  FacturacionReporteCobranzaOperativa,
  FacturacionReporteCobradorRow,
  FacturacionReporteMetodoPagoRow,
  FacturacionReporteOrigenPagoRow,
  FacturacionReporteRutaRow,
} from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-cobranza-operativa';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionReporteMoneyHelper as Money } from './facturacion-reporte-money.helper';

export class FacturacionReporteCobranzaOperativaBuilder {
  static build(pagos: PagoReporteRow[]): FacturacionReporteCobranzaOperativa {
    return {
      cobradores: this.buildCobradores(pagos),

      rutas: this.buildRutas(pagos),

      metodosPago: this.buildMetodosPago(pagos),

      origenesPago: this.buildOrigenesPago(pagos),

      control: this.buildControl(pagos),
    };
  }

  // COBRADORES

  private static buildCobradores(
    pagos: PagoReporteRow[],
  ): FacturacionReporteCobradorRow[] {
    interface Accumulator {
      cobradorId: number | null;

      cobrador: string;

      pagosRegistrados: number;

      clienteIds: Set<number>;

      facturaIds: Set<number>;

      totalCents: number;
    }

    const map = new Map<string, Accumulator>();

    const totalRecaudadoCents = this.sumPagos(pagos);

    for (const pago of pagos) {
      const key =
        pago.cobradorId !== null
          ? `COBRADOR:${pago.cobradorId}`
          : 'SIN_COBRADOR';

      let item = map.get(key);

      if (!item) {
        item = {
          cobradorId: pago.cobradorId,

          cobrador: pago.cobradorNombre ?? 'Sin cobrador registrado',

          pagosRegistrados: 0,

          clienteIds: new Set<number>(),

          facturaIds: new Set<number>(),

          totalCents: 0,
        };

        map.set(key, item);
      }

      item.pagosRegistrados += 1;

      item.clienteIds.add(pago.clienteId);

      item.facturaIds.add(pago.facturaInternetId);

      item.totalCents += Money.toCents(pago.montoPagado);
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.totalCents - a.totalCents ||
          a.cobrador.localeCompare(b.cobrador, 'es'),
      )
      .map((item) => ({
        cobradorId: item.cobradorId,

        cobrador: item.cobrador,

        pagosRegistrados: item.pagosRegistrados,

        clientesCobrados: item.clienteIds.size,

        facturasConPago: item.facturaIds.size,

        totalRecaudado: Money.fromCents(item.totalCents),

        pagoPromedio: Money.average(item.totalCents, item.pagosRegistrados),

        porcentajeRecaudacion: Money.percentage(
          item.totalCents,
          totalRecaudadoCents,
        ),
      }));
  }

  // RUTAS

  private static buildRutas(
    pagos: PagoReporteRow[],
  ): FacturacionReporteRutaRow[] {
    interface Accumulator {
      rutaId: number;

      ruta: string;

      pagosRegistrados: number;

      clienteIds: Set<number>;

      facturaIds: Set<number>;

      totalCents: number;
    }

    const pagosConRuta = pagos.filter(
      (
        pago,
      ): pago is PagoReporteRow & {
        rutaId: number;
      } => pago.rutaId !== null,
    );

    const totalRutasCents = this.sumPagos(pagosConRuta);

    const map = new Map<number, Accumulator>();

    for (const pago of pagosConRuta) {
      let item = map.get(pago.rutaId);

      if (!item) {
        item = {
          rutaId: pago.rutaId,

          ruta: pago.rutaNombre ?? `Ruta ${pago.rutaId}`,

          pagosRegistrados: 0,

          clienteIds: new Set<number>(),

          facturaIds: new Set<number>(),

          totalCents: 0,
        };

        map.set(pago.rutaId, item);
      }

      item.pagosRegistrados += 1;

      item.clienteIds.add(pago.clienteId);

      item.facturaIds.add(pago.facturaInternetId);

      item.totalCents += Money.toCents(pago.montoPagado);
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.totalCents - a.totalCents || a.ruta.localeCompare(b.ruta, 'es'),
      )
      .map((item) => ({
        rutaId: item.rutaId,

        ruta: item.ruta,

        pagosRegistrados: item.pagosRegistrados,

        clientesCobrados: item.clienteIds.size,

        facturasConPago: item.facturaIds.size,

        totalRecaudado: Money.fromCents(item.totalCents),

        pagoPromedio: Money.average(item.totalCents, item.pagosRegistrados),

        porcentajeRecaudacionRutas: Money.percentage(
          item.totalCents,
          totalRutasCents,
        ),
      }));
  }

  // MÉTODOS DE PAGO

  private static buildMetodosPago(
    pagos: PagoReporteRow[],
  ): FacturacionReporteMetodoPagoRow[] {
    interface Accumulator {
      metodoPago: PagoReporteRow['metodoPago'];

      pagosRegistrados: number;

      clienteIds: Set<number>;

      totalCents: number;
    }

    const map = new Map<PagoReporteRow['metodoPago'], Accumulator>();

    const totalRecaudadoCents = this.sumPagos(pagos);

    for (const pago of pagos) {
      let item = map.get(pago.metodoPago);

      if (!item) {
        item = {
          metodoPago: pago.metodoPago,

          pagosRegistrados: 0,

          clienteIds: new Set<number>(),

          totalCents: 0,
        };

        map.set(pago.metodoPago, item);
      }

      item.pagosRegistrados += 1;

      item.clienteIds.add(pago.clienteId);

      item.totalCents += Money.toCents(pago.montoPagado);
    }

    return [...map.values()]
      .sort((a, b) => b.totalCents - a.totalCents)
      .map((item) => ({
        metodoPago: item.metodoPago,

        pagosRegistrados: item.pagosRegistrados,

        clientesQuePagaron: item.clienteIds.size,

        totalRecaudado: Money.fromCents(item.totalCents),

        porcentajeRecaudacion: Money.percentage(
          item.totalCents,
          totalRecaudadoCents,
        ),
      }));
  }

  // ORIGEN DEL PAGO

  private static buildOrigenesPago(
    pagos: PagoReporteRow[],
  ): FacturacionReporteOrigenPagoRow[] {
    interface Accumulator {
      origen: PagoReporteRow['origen'];

      pagosRegistrados: number;

      clienteIds: Set<number>;

      totalCents: number;
    }

    const map = new Map<PagoReporteRow['origen'], Accumulator>();

    const totalRecaudadoCents = this.sumPagos(pagos);

    for (const pago of pagos) {
      let item = map.get(pago.origen);

      if (!item) {
        item = {
          origen: pago.origen,

          pagosRegistrados: 0,

          clienteIds: new Set<number>(),

          totalCents: 0,
        };

        map.set(pago.origen, item);
      }

      item.pagosRegistrados += 1;

      item.clienteIds.add(pago.clienteId);

      item.totalCents += Money.toCents(pago.montoPagado);
    }

    return [...map.values()]
      .sort((a, b) => b.totalCents - a.totalCents)
      .map((item) => ({
        origen: item.origen,

        pagosRegistrados: item.pagosRegistrados,

        clientesQuePagaron: item.clienteIds.size,

        totalRecaudado: Money.fromCents(item.totalCents),

        porcentajeRecaudacion: Money.percentage(
          item.totalCents,
          totalRecaudadoCents,
        ),
      }));
  }

  // CONTROL

  private static buildControl(pagos: PagoReporteRow[]) {
    let pagosSinCobradorRegistrado = 0;

    let montoSinCobradorCents = 0;

    let pagosOrigenRutaSinRutaVinculada = 0;

    let montoOrigenRutaSinRutaCents = 0;

    for (const pago of pagos) {
      const montoCents = Money.toCents(pago.montoPagado);

      if (pago.cobradorId === null) {
        pagosSinCobradorRegistrado += 1;

        montoSinCobradorCents += montoCents;
      }

      if (
        pago.origen === FacturacionReporteOrigenPago.RUTA &&
        pago.rutaId === null
      ) {
        pagosOrigenRutaSinRutaVinculada += 1;

        montoOrigenRutaSinRutaCents += montoCents;
      }
    }

    return {
      pagosSinCobradorRegistrado,

      montoSinCobradorRegistrado: Money.fromCents(montoSinCobradorCents),

      pagosOrigenRutaSinRutaVinculada,

      montoOrigenRutaSinRutaVinculada: Money.fromCents(
        montoOrigenRutaSinRutaCents,
      ),
    };
  }

  // MONEY

  private static sumPagos(
    pagos: Array<Pick<PagoReporteRow, 'montoPagado'>>,
  ): number {
    return pagos.reduce(
      (total, pago) => total + Money.toCents(pago.montoPagado),
      0,
    );
  }
}
