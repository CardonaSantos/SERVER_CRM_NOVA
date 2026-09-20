import {
  Inject,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';

import { FacturacionReporteFilters } from '../../../domain/filters/facturacion-reporte/facturacion-reporte-filters';

import {
  FACTURACION_REPORTE_QUERY_PORT,
  FacturacionReporteCarteraQueryParams,
  FacturacionReporteFacturaQueryParams,
  FacturacionReporteFacturasProyeccionQueryParams,
  FacturacionReportePagoCohorteQueryParams,
  FacturacionReportePagoRangoQueryParams,
  FacturacionReporteProyeccionQueryParams,
  FacturacionReporteQueryPort,
} from '../../../domain/ports/facturacion-reportes/facturacion-reporte-query.port';

import { FacturacionReporteData } from '../../../domain/read-models/facturacion-reporte/facturacion-reporte-data';

import { FacturaReporteRow } from '../../../domain/read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../../domain/read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionReportePeriodosFactory } from '../../factory/facturacion-report/facturacion-reporte-periodos.factory';
import { FacturacionReporteZonasBuilder } from '../../builders/facturacion-reporte/facturacion-reporte-zonas.builder';
import { FacturacionReporteDashboardBuilder } from '../../builders/facturacion-reporte/facturacion-reporte-dashboard.builder';
import { FacturacionReporteEvolucionBuilder } from '../../builders/facturacion-reporte/facturacion-reporte-evolucion.builder';
import { FacturacionReporteCarteraBuilder } from '../../builders/facturacion-reporte/facturacion-reporte-cartera.builder';
import { FacturacionReporteCobranzaOperativaBuilder } from '../../builders/facturacion-reporte/facturacion-reporte-cobranza-operativa.builder';

@Injectable()
export class ObtenerReporteFacturacionDataUseCase {
  constructor(
    @Inject(FACTURACION_REPORTE_QUERY_PORT)
    private readonly facturacionReporteQuery: FacturacionReporteQueryPort,
  ) {}

  async execute(
    filters: FacturacionReporteFilters,
  ): Promise<FacturacionReporteData> {
    const generadoEn = new Date();

    // RANGO

    const rango = FacturacionReportePeriodosFactory.normalizar(
      filters,
      generadoEn,
    );

    // NORMALIZAR FILTROS

    const estadosFactura = [...new Set(filters.estadosFactura ?? [])];

    const metodosPago = [...new Set(filters.metodosPago ?? [])];

    const origenesPago = [...new Set(filters.origenesPago ?? [])];

    const zonaIds = this.normalizarIds(filters.zonaIds);

    const creadorIds = this.normalizarIds(filters.creadorIds);

    const cobradorIds = this.normalizarIds(filters.cobradorIds);

    const rutaIds = this.normalizarIds(filters.rutaIds);

    const clienteId = filters.clienteId ?? null;

    // QUERY PARAMS

    const facturaParams: FacturacionReporteFacturaQueryParams = {
      periodoDesde: rango.periodoDesde,

      periodoHasta: rango.periodoHasta,

      estadosFactura,

      zonaIds,

      creadorIds,

      clienteId,
    };

    const pagoRangoParams: FacturacionReportePagoRangoQueryParams = {
      fechaPagoDesdeInclusivo: rango.desdeInclusivo,

      fechaPagoHastaExclusivo: rango.hastaExclusivo,

      metodosPago,

      origenesPago,

      cobradorIds,

      rutaIds,

      zonaIds,

      clienteId,
    };

    const pagoCohorteParams: FacturacionReportePagoCohorteQueryParams = {
      periodoDesde: rango.periodoDesde,

      periodoHasta: rango.periodoHasta,

      estadosFactura,

      zonaIds,

      creadorIds,

      clienteId,

      fechaCorte: generadoEn,
    };

    const carteraParams: FacturacionReporteCarteraQueryParams = {
      estadosFactura,

      zonaIds,

      creadorIds,

      clienteId,
    };

    const proyeccionParams: FacturacionReporteProyeccionQueryParams = {
      zonaIds,

      clienteId,
    };

    const periodosObjetivoProyeccion =
      FacturacionReportePeriodosFactory.crearPeriodosObjetivoPosibles(
        rango.mesesGeneracionProyeccion,
      );

    const facturasProyeccionParams: FacturacionReporteFacturasProyeccionQueryParams =
      {
        periodos: periodosObjetivoProyeccion,

        zonaIds,

        clienteId,
      };

    // CONSULTAS

    const [
      facturas,
      pagosRegistrados,
      pagosCohorte,
      carteraPendiente,
      clientesProyeccion,
      facturasProyeccionExistentes,
    ] = await Promise.all([
      this.facturacionReporteQuery.findFacturas(facturaParams),

      this.facturacionReporteQuery.findPagosRegistrados(pagoRangoParams),

      this.facturacionReporteQuery.findPagosDeFacturas(pagoCohorteParams),

      this.facturacionReporteQuery.findCarteraPendiente(carteraParams),

      this.facturacionReporteQuery.findClientesProyeccion(proyeccionParams),

      this.facturacionReporteQuery.findFacturasProyeccionExistentes(
        facturasProyeccionParams,
      ),
    ]);

    // VALIDAR GRANULARIDAD

    this.assertFacturasUnicas(facturas, 'facturas del rango');

    this.assertFacturasUnicas(carteraPendiente, 'cartera pendiente');

    this.assertPagosUnicos(pagosRegistrados, 'pagos registrados');

    this.assertPagosUnicos(pagosCohorte, 'pagos de cohorte');

    this.assertFacturasUnicas(
      facturasProyeccionExistentes,
      'facturas existentes de proyección',
    );

    // DERIVAR VISTAS

    const zonas = FacturacionReporteZonasBuilder.build({
      facturas,

      pagosRegistrados,

      clientesProyeccion,

      facturasProyeccionExistentes,

      mesesGeneracionProyeccion: rango.mesesGeneracionProyeccion,

      fechaCorte: generadoEn,
    });

    const dashboard = FacturacionReporteDashboardBuilder.build({
      facturas,

      pagosRegistrados,

      carteraPendiente,

      proyeccionZonas: zonas.proyeccion,

      fechaCorte: generadoEn,
    });

    const evolucion = FacturacionReporteEvolucionBuilder.build({
      facturas,

      pagosRegistrados,

      pagosCohorte,

      periodos: rango.periodos,

      fechaCorte: generadoEn,
    });

    const cartera = FacturacionReporteCarteraBuilder.build(
      carteraPendiente,
      generadoEn,
    );

    const cobranzaOperativa =
      FacturacionReporteCobranzaOperativaBuilder.build(pagosRegistrados);

    // DATA FINAL

    return {
      metadata: {
        generadoEn,

        fechaCorte: generadoEn,

        periodoDesde: rango.periodoDesde,

        periodoHasta: rango.periodoHasta,

        fechaPagoDesdeInclusivo: rango.desdeInclusivo,

        fechaPagoHastaExclusivo: rango.hastaExclusivo,

        periodosProyeccion: [
          ...new Set(zonas.proyeccion.map((item) => item.periodo)),
        ].sort(),

        mesesProyeccion: rango.mesesProyeccion,

        filtros: {
          facturacion: {
            estadosFactura,

            zonaIds,

            creadorIds,

            clienteId,
          },

          cobranza: {
            metodosPago,

            origenesPago,

            cobradorIds,

            rutaIds,
          },
        },
      },

      dashboard,

      evolucion,

      cartera,

      zonas,

      cobranzaOperativa,

      facturas,
      pagosCohorte,

      /**
       * No exponemos pagosCohorte aquí.
       *
       * Esos movimientos son auxiliares
       * exclusivamente para calcular recuperación.
       *
       * La hoja "Pagos" debe conciliar contra
       * dashboard.cobros.totalRecaudado.
       */
      pagos: pagosRegistrados,
    };
  }

  // IDS

  private normalizarIds(ids?: number[]): number[] {
    return [
      ...new Set((ids ?? []).filter((id) => Number.isInteger(id) && id > 0)),
    ];
  }
  // GRANULARIDAD

  private assertFacturasUnicas(
    facturas: FacturaReporteRow[],

    universo: string,
  ): void {
    const ids = new Set<number>();

    for (const factura of facturas) {
      if (ids.has(factura.facturaId)) {
        throw new InternalServerErrorException(
          `El reporte de facturación recibió la factura ${factura.facturaId} más de una vez en ${universo}.`,
        );
      }

      ids.add(factura.facturaId);
    }
  }

  private assertPagosUnicos(
    pagos: PagoReporteRow[],

    universo: string,
  ): void {
    const ids = new Set<number>();

    for (const pago of pagos) {
      if (ids.has(pago.pagoId)) {
        throw new InternalServerErrorException(
          `El reporte de facturación recibió el pago ${pago.pagoId} más de una vez en ${universo}.`,
        );
      }

      ids.add(pago.pagoId);
    }
  }
}
