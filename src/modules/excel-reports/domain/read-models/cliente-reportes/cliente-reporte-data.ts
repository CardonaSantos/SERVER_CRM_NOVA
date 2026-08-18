import { ClienteReporteDistribuciones } from './cliente-reporte-distribuciones';
import { ClienteReporteEvolucionMes } from './cliente-reporte-evolucion-mes';
import { ClienteReportePeriodoResumen } from './cliente-reporte-periodo';
import { ClienteReporteResumen } from './cliente-reporte-resumen';
import { ClienteReporteRow } from './cliente-reporte-row';

export interface ClienteReporteData {
  generadoEn: Date;

  /**
   * Fotografía actual/global.
   */
  resumen: ClienteReporteResumen;

  /**
   * Movimiento correspondiente
   * al mes actual.
   */
  mesActual: ClienteReportePeriodoResumen;

  /**
   * Acumulado correspondiente
   * al año actual.
   */
  anioActual: ClienteReportePeriodoResumen;

  /**
   * Últimos 12 meses.
   */
  evolucionMensual: ClienteReporteEvolucionMes[];

  /**
   * Distribución actual de la cartera.
   */
  distribuciones: ClienteReporteDistribuciones;

  /**
   * Detalle de clientes.
   */
  clientes: ClienteReporteRow[];
}
