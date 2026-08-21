import { dayjs } from 'src/Utils/dayjs.config';
import { TZ } from 'src/Utils/tzgt';
import {
  FacturacionReporteAgingBucket,
  FacturacionReporteAgingRow,
  FacturacionReporteCartera,
  FacturacionReporteCarteraClienteRow,
  FacturacionReporteCarteraZonaRow,
} from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-cartera';
import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';
import { FacturacionReporteMoneyHelper as Money } from './facturacion-reporte-money.helper';

// CONFIGURACIÓN AGING

interface AgingDefinition {
  bucket: FacturacionReporteAgingBucket;

  etiqueta: string;
}

const AGING_DEFINITIONS: AgingDefinition[] = [
  {
    bucket: 'POR_VENCER',
    etiqueta: 'Por vencer',
  },
  {
    bucket: '1_30_DIAS',
    etiqueta: '1–30 días',
  },
  {
    bucket: '31_60_DIAS',
    etiqueta: '31–60 días',
  },
  {
    bucket: '61_90_DIAS',
    etiqueta: '61–90 días',
  },
  {
    bucket: '91_180_DIAS',
    etiqueta: '91–180 días',
  },
  {
    bucket: 'MAS_180_DIAS',
    etiqueta: 'Más de 180 días',
  },
  {
    bucket: 'SIN_FECHA',
    etiqueta: 'Sin fecha de vencimiento',
  },
];

// BUILDER

export class FacturacionReporteCarteraBuilder {
  static build(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): FacturacionReporteCartera {
    return {
      aging: this.buildAging(facturas, fechaCorte),

      porZona: this.buildPorZona(facturas, fechaCorte),

      clientes: this.buildClientes(facturas, fechaCorte),
    };
  }

  // AGING

  private static buildAging(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): FacturacionReporteAgingRow[] {
    interface Accumulator {
      facturas: number;

      clienteIds: Set<number>;

      saldoCents: number;
    }

    const map = new Map<FacturacionReporteAgingBucket, Accumulator>();

    for (const definition of AGING_DEFINITIONS) {
      map.set(definition.bucket, {
        facturas: 0,

        clienteIds: new Set<number>(),

        saldoCents: 0,
      });
    }

    const totalCarteraCents = this.sumSaldo(facturas);

    for (const factura of facturas) {
      const bucket = this.resolveAgingBucket(
        factura.fechaPagoEsperada,
        fechaCorte,
      );

      const item = map.get(bucket);

      if (!item) {
        continue;
      }

      item.facturas += 1;

      item.clienteIds.add(factura.clienteId);

      item.saldoCents += Money.toCents(factura.saldoPendiente);
    }

    return AGING_DEFINITIONS.map((definition) => {
      const item = map.get(definition.bucket)!;

      return {
        bucket: definition.bucket,

        etiqueta: definition.etiqueta,

        facturas: item.facturas,

        clientes: item.clienteIds.size,

        saldoPendiente: Money.fromCents(item.saldoCents),

        porcentajeCartera: Money.percentage(item.saldoCents, totalCarteraCents),
      };
    });
  }

  // CARTERA POR ZONA

  private static buildPorZona(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): FacturacionReporteCarteraZonaRow[] {
    interface Accumulator {
      facturacionZonaId: number | null;

      zona: string;

      facturasPendientes: number;

      clienteIds: Set<number>;

      saldoPendienteCents: number;

      saldoVencidoCents: number;

      saldoPorVencerCents: number;

      saldoSinFechaCents: number;
    }

    const map = new Map<string, Accumulator>();

    const totalCarteraCents = this.sumSaldo(facturas);

    for (const factura of facturas) {
      const key =
        factura.facturacionZonaId !== null
          ? `ZONA:${factura.facturacionZonaId}`
          : 'SIN_ZONA';

      let item = map.get(key);

      if (!item) {
        item = {
          facturacionZonaId: factura.facturacionZonaId,

          zona: factura.facturacionZonaNombre ?? 'Sin zona',

          facturasPendientes: 0,

          clienteIds: new Set<number>(),

          saldoPendienteCents: 0,

          saldoVencidoCents: 0,

          saldoPorVencerCents: 0,

          saldoSinFechaCents: 0,
        };

        map.set(key, item);
      }

      const saldoCents = Money.toCents(factura.saldoPendiente);

      item.facturasPendientes += 1;

      item.clienteIds.add(factura.clienteId);

      item.saldoPendienteCents += saldoCents;

      if (!factura.fechaPagoEsperada) {
        item.saldoSinFechaCents += saldoCents;

        continue;
      }

      if (this.esVencida(factura.fechaPagoEsperada, fechaCorte)) {
        item.saldoVencidoCents += saldoCents;
      } else {
        item.saldoPorVencerCents += saldoCents;
      }
    }

    return [...map.values()]
      .sort(
        (a, b) =>
          b.saldoPendienteCents - a.saldoPendienteCents ||
          a.zona.localeCompare(b.zona, 'es'),
      )
      .map((item) => ({
        facturacionZonaId: item.facturacionZonaId,

        zona: item.zona,

        facturasPendientes: item.facturasPendientes,

        clientesConDeuda: item.clienteIds.size,

        saldoPendiente: Money.fromCents(item.saldoPendienteCents),

        saldoVencido: Money.fromCents(item.saldoVencidoCents),

        saldoPorVencer: Money.fromCents(item.saldoPorVencerCents),

        saldoSinFechaVencimiento: Money.fromCents(item.saldoSinFechaCents),

        porcentajeCartera: Money.percentage(
          item.saldoPendienteCents,
          totalCarteraCents,
        ),
      }));
  }

  // CLIENTES DEUDORES

  private static buildClientes(
    facturas: FacturaReporteRow[],
    fechaCorte: Date,
  ): FacturacionReporteCarteraClienteRow[] {
    interface Accumulator {
      clienteId: number;

      cliente: string;

      zonas: Set<string>;

      facturasPendientes: number;

      facturasVencidas: number;

      fechaMasAntigua: Date | null;

      saldoVencidoCents: number;

      saldoPorVencerCents: number;

      saldoSinFechaCents: number;

      totalCents: number;
    }

    const map = new Map<number, Accumulator>();

    for (const factura of facturas) {
      let item = map.get(factura.clienteId);

      if (!item) {
        item = {
          clienteId: factura.clienteId,

          cliente: factura.clienteNombreActual,

          zonas: new Set<string>(),

          facturasPendientes: 0,

          facturasVencidas: 0,

          fechaMasAntigua: null,

          saldoVencidoCents: 0,

          saldoPorVencerCents: 0,

          saldoSinFechaCents: 0,

          totalCents: 0,
        };

        map.set(factura.clienteId, item);
      }

      const saldoCents = Money.toCents(factura.saldoPendiente);

      item.facturasPendientes += 1;

      item.totalCents += saldoCents;

      item.zonas.add(factura.facturacionZonaNombre ?? 'Sin zona');

      if (factura.fechaPagoEsperada) {
        item.fechaMasAntigua = this.minDate(
          item.fechaMasAntigua,
          factura.fechaPagoEsperada,
        );

        if (this.esVencida(factura.fechaPagoEsperada, fechaCorte)) {
          item.facturasVencidas += 1;

          item.saldoVencidoCents += saldoCents;
        } else {
          item.saldoPorVencerCents += saldoCents;
        }
      } else {
        item.saldoSinFechaCents += saldoCents;
      }
    }

    return [...map.values()]
      .sort((a, b) => b.totalCents - a.totalCents || a.clienteId - b.clienteId)
      .map((item) => ({
        clienteId: item.clienteId,

        cliente: item.cliente,

        zonas: [...item.zonas].sort((a, b) => a.localeCompare(b, 'es')),

        facturasPendientes: item.facturasPendientes,

        facturasVencidas: item.facturasVencidas,

        fechaPagoEsperadaMasAntigua: item.fechaMasAntigua,

        diasMoraMaximos: this.calculateDiasMora(
          item.fechaMasAntigua,
          fechaCorte,
        ),

        saldoVencido: Money.fromCents(item.saldoVencidoCents),

        saldoPorVencer: Money.fromCents(item.saldoPorVencerCents),

        saldoSinFechaVencimiento: Money.fromCents(item.saldoSinFechaCents),

        totalPendiente: Money.fromCents(item.totalCents),
      }));
  }

  // AGING

  private static resolveAgingBucket(
    fechaPagoEsperada: Date | null,
    fechaCorte: Date,
  ): FacturacionReporteAgingBucket {
    if (!fechaPagoEsperada) {
      return 'SIN_FECHA';
    }

    const diasMora = this.calculateDiasMora(fechaPagoEsperada, fechaCorte);

    if (diasMora === null || diasMora <= 0) {
      return 'POR_VENCER';
    }

    if (diasMora <= 30) {
      return '1_30_DIAS';
    }

    if (diasMora <= 60) {
      return '31_60_DIAS';
    }

    if (diasMora <= 90) {
      return '61_90_DIAS';
    }

    if (diasMora <= 180) {
      return '91_180_DIAS';
    }

    return 'MAS_180_DIAS';
  }

  // FECHAS

  private static esVencida(fechaPagoEsperada: Date, fechaCorte: Date): boolean {
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

    return Math.max(corte.diff(esperada, 'day'), 0);
  }

  private static minDate(current: Date | null, candidate: Date): Date {
    if (!current) {
      return candidate;
    }

    return candidate.getTime() < current.getTime() ? candidate : current;
  }

  // MONEY

  private static sumSaldo(facturas: FacturaReporteRow[]): number {
    return facturas.reduce(
      (total, factura) => total + Money.toCents(factura.saldoPendiente),
      0,
    );
  }
}
