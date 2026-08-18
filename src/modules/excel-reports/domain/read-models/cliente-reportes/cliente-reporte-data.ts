import { ClienteReporteRow } from './cliente-reporte-row';
import { ClienteReporteResumen } from './cliente-reporte-resumen';

export interface ClienteReporteData {
  resumen: ClienteReporteResumen;

  clientes: ClienteReporteRow[];
}
