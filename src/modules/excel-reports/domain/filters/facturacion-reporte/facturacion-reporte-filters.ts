import { FacturacionReporteEstadoFactura } from '../../enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import { FacturacionReporteMetodoPago } from '../../enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import { FacturacionReporteOrigenPago } from '../../enums/facturacion-report/facturacion-reporte-origen-pago.enum';

export interface FacturacionReporteFilters {
  // =====================================================
  // PERÍODO
  // =====================================================

  /**
   * Período inicial de FacturaInternet.periodo.
   *
   * Formato:
   * YYYYMM
   *
   * Ejemplo:
   * 202501
   */
  periodoDesde?: string;

  /**
   * Período final de FacturaInternet.periodo.
   *
   * Formato:
   * YYYYMM
   *
   * Ejemplo:
   * 202508
   */
  periodoHasta?: string;

  /**
   * Cantidad de meses futuros a proyectar.
   *
   * Default:
   * 3
   */
  mesesProyeccion?: number;

  // =====================================================
  // FACTURACIÓN
  // =====================================================

  estadosFactura?: FacturacionReporteEstadoFactura[];

  zonaIds?: number[];

  creadorIds?: number[];

  clienteId?: number;

  // =====================================================
  // COBRANZA
  // =====================================================

  metodosPago?: FacturacionReporteMetodoPago[];

  origenesPago?: FacturacionReporteOrigenPago[];

  cobradorIds?: number[];

  rutaIds?: number[];
}
