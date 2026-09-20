import type { FacturacionReporteEstadoFactura } from '../../enums/facturacion-report/facturacion-reporte-estado-factura.enum';

import type { FacturacionReporteMetodoPago } from '../../enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import type { FacturacionReporteOrigenPago } from '../../enums/facturacion-report/facturacion-reporte-origen-pago.enum';

import { FacturaReporteRow } from '../../read-models/facturacion-reporte/factura-reporte-row';

import { PagoReporteRow } from '../../read-models/facturacion-reporte/pago-reporte-row';

import { FacturacionProyeccionClienteRow } from '../../read-models/facturacion-reporte/facturacion-proyeccion-cliente-row';

// =====================================================
// FACTURAS YA EXISTENTES EN PERIODOS DE PROYECCIÓN
// =====================================================

export interface FacturacionReporteFacturasProyeccionQueryParams {
  /**
   * Períodos potencialmente generables.
   *
   * Formato:
   * YYYYMM
   */
  periodos: string[];

  zonaIds: number[];

  clienteId: number | null;
}

// =====================================================
// FACTURAS DEL RANGO
// =====================================================

export interface FacturacionReporteFacturaQueryParams {
  /**
   * Ambos inclusivos.
   *
   * Ejemplo:
   * 202501 -> 202508
   */
  periodoDesde: string;

  periodoHasta: string;

  /**
   * Estados efectivos ya normalizados
   * por el caso de uso.
   */
  estadosFactura: FacturacionReporteEstadoFactura[];

  zonaIds: number[];

  creadorIds: number[];

  /**
   * null = todos.
   */
  clienteId: number | null;
}

// =====================================================
// PAGOS REGISTRADOS DURANTE EL RANGO
// =====================================================

export interface FacturacionReportePagoRangoQueryParams {
  /**
   * Se aplican sobre PagoFacturaInternet.fechaPago.
   */
  fechaPagoDesdeInclusivo: Date;

  fechaPagoHastaExclusivo: Date;

  metodosPago: FacturacionReporteMetodoPago[];

  origenesPago: FacturacionReporteOrigenPago[];

  cobradorIds: number[];

  rutaIds: number[];

  /**
   * Dimensiones que pueden resolverse desde
   * la factura/cliente relacionado al pago.
   */
  zonaIds: number[];

  clienteId: number | null;
}

// =====================================================
// PAGOS DE LAS FACTURAS DEL RANGO
// =====================================================

export interface FacturacionReportePagoCohorteQueryParams {
  /**
   * Selecciona las facturas por su periodo YYYYMM.
   *
   * Los pagos pueden haberse registrado después.
   */
  periodoDesde: string;

  periodoHasta: string;

  estadosFactura: FacturacionReporteEstadoFactura[];

  zonaIds: number[];

  creadorIds: number[];

  clienteId: number | null;

  /**
   * No considerar movimientos posteriores
   * a la generación del reporte.
   */
  fechaCorte: Date;
}

// CARTERA ACTUAL

export interface FacturacionReporteCarteraQueryParams {
  estadosFactura: FacturacionReporteEstadoFactura[];

  zonaIds: number[];

  creadorIds: number[];

  clienteId: number | null;
}

// =====================================================
// PROYECCIÓN
// =====================================================

export interface FacturacionReporteProyeccionQueryParams {
  zonaIds: number[];

  clienteId: number | null;
}

// =====================================================
// PORT
// =====================================================

export interface FacturacionReporteQueryPort {
  /**
   * Facturas que ya existen en alguno de los
   * períodos potencialmente proyectables.
   *
   * NO aplicar filtros por estado.
   *
   * Incluso una factura ANULADA sigue existiendo
   * para la clave:
   *
   * cliente + zona + periodo.
   */
  findFacturasProyeccionExistentes(
    params: FacturacionReporteFacturasProyeccionQueryParams,
  ): Promise<FacturaReporteRow[]>;

  /**
   * Facturas pertenecientes al rango de periodos
   * solicitado.
   *
   * 1 FacturaInternet = 1 FacturaReporteRow.
   */
  findFacturas(
    params: FacturacionReporteFacturaQueryParams,
  ): Promise<FacturaReporteRow[]>;

  /**
   * Pagos efectivamente registrados durante
   * las fechas calendario del reporte.
   *
   * Sirve para:
   *
   * - recaudación;
   * - cobradores;
   * - rutas;
   * - métodos;
   * - orígenes;
   * - top pagadores.
   */
  findPagosRegistrados(
    params: FacturacionReportePagoRangoQueryParams,
  ): Promise<PagoReporteRow[]>;

  /**
   * Pagos asociados a las facturas de los
   * periodos seleccionados, aunque el pago
   * haya ocurrido posteriormente.
   *
   * Sirve para recuperación por cohorte.
   */
  findPagosDeFacturas(
    params: FacturacionReportePagoCohorteQueryParams,
  ): Promise<PagoReporteRow[]>;

  /**
   * Facturas que actualmente mantienen saldo.
   *
   * No representa una reconstrucción histórica:
   * es la cartera existente al momento del reporte.
   */
  findCarteraPendiente(
    params: FacturacionReporteCarteraQueryParams,
  ): Promise<FacturaReporteRow[]>;

  /**
   * Snapshot actual de clientes utilizables
   * para proyección futura.
   */
  findClientesProyeccion(
    params: FacturacionReporteProyeccionQueryParams,
  ): Promise<FacturacionProyeccionClienteRow[]>;
}

export const FACTURACION_REPORTE_QUERY_PORT = Symbol(
  'FACTURACION_REPORTE_QUERY_PORT',
);
