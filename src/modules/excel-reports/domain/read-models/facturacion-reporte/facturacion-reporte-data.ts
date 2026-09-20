import { FacturacionReporteEstadoFactura } from '../../enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import { FacturacionReporteMetodoPago } from '../../enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import { FacturacionReporteOrigenPago } from '../../enums/facturacion-report/facturacion-reporte-origen-pago.enum';

import { FacturacionReporteCartera } from './facturacion-reporte-cartera';

import { FacturacionReporteCobranzaOperativa } from './facturacion-reporte-cobranza-operativa';

import { FacturacionReporteDashboard } from './facturacion-reporte-dashboard';

import { FacturacionReporteEvolucion } from './facturacion-reporte-evolucion';

import { FacturacionReporteZonas } from './facturacion-reporte-zonas';

import { FacturaReporteRow } from './factura-reporte-row';

import { PagoReporteRow } from './pago-reporte-row';

// METADATA

export interface FacturacionReporteMetadata {
  generadoEn: Date;

  fechaCorte: Date;

  // RANGO DE FACTURACIÓN

  periodoDesde: string;

  periodoHasta: string;

  // RANGO CALENDARIO DE PAGOS

  fechaPagoDesdeInclusivo: Date;

  fechaPagoHastaExclusivo: Date;

  // PROYECCIÓN

  periodosProyeccion: string[];

  mesesProyeccion: number;

  // FILTROS EFECTIVOS

  filtros: {
    facturacion: {
      estadosFactura: FacturacionReporteEstadoFactura[];

      zonaIds: number[];

      creadorIds: number[];

      clienteId: number | null;
    };

    cobranza: {
      metodosPago: FacturacionReporteMetodoPago[];

      origenesPago: FacturacionReporteOrigenPago[];

      cobradorIds: number[];

      rutaIds: number[];
    };
  };
}

// DATA

export interface FacturacionReporteData {
  metadata: FacturacionReporteMetadata;

  /**
   * 01 Resumen
   */
  dashboard: FacturacionReporteDashboard;

  /**
   * 02 Evolución
   */
  evolucion: FacturacionReporteEvolucion;

  /**
   * 03 Cartera
   */
  cartera: FacturacionReporteCartera;

  /**
   * 04 Zonas
   */
  zonas: FacturacionReporteZonas;

  /**
   * 05 Rutas y cobradores
   */
  cobranzaOperativa: FacturacionReporteCobranzaOperativa;

  /**
   * 06 Facturas
   */
  facturas: FacturaReporteRow[];

  /**
   * Movimientos asociados a las facturas
   * seleccionadas, hasta fechaCorte.
   *
   * Uso interno:
   *
   * - recuperación por cohorte;
   * - cantidad de pagos por factura;
   * - último pago de una factura.
   *
   * NO corresponde a la hoja "Pagos".
   */
  pagosCohorte: PagoReporteRow[];

  /**
   * 07 Pagos
   *
   * Son exclusivamente los pagos registrados
   * dentro del rango calendario seleccionado.
   */
  pagos: PagoReporteRow[];
}
