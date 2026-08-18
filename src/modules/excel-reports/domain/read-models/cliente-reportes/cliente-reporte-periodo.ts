import { ReporteCantidadPorCategoria } from './cliente-reporte-resumen';

export interface ClienteReportePeriodoResumen {
  etiqueta: string;

  desde: Date;

  /**
   * El límite superior no se incluye.
   *
   * Ejemplo:
   * desde = 2026-08-01 00:00
   * hastaExclusivo = 2026-09-01 00:00
   */
  hastaExclusivo: Date;

  /**
   * Servicios efectivamente activados
   * durante el período.
   */
  altas: number;

  /**
   * Desinstalaciones efectivamente
   * completadas durante el período.
   */
  bajas: number;

  /**
   * altas - bajas
   */
  crecimientoNeto: number;

  instalaciones: {
    /**
     * Órdenes de instalación creadas
     * durante el período.
     */
    registradas: number;

    /**
     * Estado ACTUAL de esas órdenes.
     */
    porEstadoActual: Array<ReporteCantidadPorCategoria<string>>;
  };

  desinstalaciones: {
    /**
     * Órdenes de desinstalación creadas
     * durante el período.
     */
    registradas: number;

    /**
     * Estado ACTUAL de esas órdenes.
     */
    porEstadoActual: Array<ReporteCantidadPorCategoria<string>>;
  };
}
