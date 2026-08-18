import { ClienteReporteFilters } from '../../filters/clientes-query-filters';
import { ClienteReporteResumen } from '../../read-models/cliente-reportes/cliente-reporte-resumen';
import { ClienteReporteRow } from '../../read-models/cliente-reportes/cliente-reporte-row';

/**
 * Puerto que pide filtros y retorna un array de Cliente Report Row
 *
 * implementable para prisma
 */
/**
 * Puerto que pide filtros y retorna un array de Cliente Report Row
 *
 * implementable para prisma
 */

export interface ClienteReporteQueryPort {
  findRows(filters: ClienteReporteFilters): Promise<ClienteReporteRow[]>;

  getResumen(filters: ClienteReporteFilters): Promise<ClienteReporteResumen>;
}

export const CLIENTE_REPORTE_QUERY_PORT = Symbol('CLIENTE_REPORTE_QUERY_PORT');
