import { ClienteReporteFilters } from '../../filters/cliente-reporte/clientes-query-filters';
import { ClienteReporteEvolucionMes } from '../../read-models/cliente-reportes/cliente-reporte-evolucion-mes';
import { ClienteReporteFinanciero } from '../../read-models/cliente-reportes/cliente-reporte-financiero';
import { ClienteReportePeriodoResumen } from '../../read-models/cliente-reportes/cliente-reporte-periodo';
import { ClienteReporteResumen } from '../../read-models/cliente-reportes/cliente-reporte-resumen';
import { ClienteReporteRow } from '../../read-models/cliente-reportes/cliente-reporte-row';

export interface ClienteReporteQueryPort {
  /**
   * Fotografía detallada actual.
   */
  findRows(filters: ClienteReporteFilters): Promise<ClienteReporteRow[]>;

  /**
   * Resumen global/current snapshot.
   */
  getResumen(filters: ClienteReporteFilters): Promise<ClienteReporteResumen>;

  /**
   * Movimiento entre dos fechas.
   */
  getResumenPeriodo(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
    etiqueta: string,
  ): Promise<ClienteReportePeriodoResumen>;

  /**
   * Altas/bajas agrupadas por mes.
   */
  getEvolucionMensual(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
  ): Promise<ClienteReporteEvolucionMes[]>;

  /**
   * Fotografía financiera de la cartera y
   * comportamiento monetario correspondiente
   * al mes evaluado.
   *
   * IMPORTANTE:
   *
   * - Los montos ya facturados provienen de FacturaInternet.
   * - Los cobros reales provienen de PagoFacturaInternet.
   * - Las facturas todavía no emitidas son una proyección
   *   basada en las reglas reales de facturación por zona.
   *
   * fechaCorte permite saber qué obligaciones ya deberían
   * haberse generado y cuáles todavía están programadas.
   */
  getResumenFinanciero(
    filters: ClienteReporteFilters,
    desde: Date,
    hastaExclusivo: Date,
    etiqueta: string,
    fechaCorte: Date,
  ): Promise<ClienteReporteFinanciero>;
}

export const CLIENTE_REPORTE_QUERY_PORT = Symbol('CLIENTE_REPORTE_QUERY_PORT');
