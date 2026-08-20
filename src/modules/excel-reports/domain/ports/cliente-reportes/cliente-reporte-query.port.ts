import { ClienteReporteFilters } from '../../filters/cliente-reporte/clientes-query-filters';
import { ClienteReporteEvolucionMes } from '../../read-models/cliente-reportes/cliente-reporte-evolucion-mes';
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
}

export const CLIENTE_REPORTE_QUERY_PORT = Symbol('CLIENTE_REPORTE_QUERY_PORT');
