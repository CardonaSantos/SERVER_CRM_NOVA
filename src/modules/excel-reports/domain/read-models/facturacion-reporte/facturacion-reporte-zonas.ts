export interface FacturacionReporteZonaFacturacionRow {
  facturacionZonaId: number | null;

  zona: string;

  facturasEmitidas: number;

  facturasAnuladas: number;

  clientesFacturados: number;

  facturado: number;

  /**
   * Estado actual de las facturas pertenecientes
   * al rango seleccionado.
   */
  montoCubiertoActual: number;

  saldoPendienteActual: number;

  porcentajeCubiertoActual: number;
}

export interface FacturacionReporteZonaRecaudacionRow {
  facturacionZonaId: number | null;

  zona: string;

  pagosRegistrados: number;

  clientesQuePagaron: number;

  recaudado: number;

  pagoPromedio: number;
}

export interface FacturacionReporteZonaProyeccionRow {
  facturacionZonaId: number;

  zona: string;

  /**
   * Período real de FacturaInternet que
   * generaría este evento.
   */
  periodo: string;

  etiqueta: string;

  diaGeneracionFactura: number;

  diaPago: number;

  fechaGeneracionProgramada: Date;

  fechaPagoProgramada: Date;

  // ===================================================
  // CARTERA ACTUAL
  // ===================================================

  clientesFacturablesActuales: number;

  potencialMensualActual: number;

  // ===================================================
  // YA EXISTENTE
  // ===================================================

  /**
   * Clientes de la cartera actual que ya poseen
   * factura para zona + periodo.
   */
  facturasYaExistentes: number;

  /**
   * De las anteriores, cuántas están ANULADA.
   */
  facturasAnuladasExistentes: number;

  /**
   * Monto real de las facturas existentes
   * no anuladas.
   *
   * No usamos precio actual para este valor.
   */
  montoYaEmitidoVigente: number;

  // ===================================================
  // PENDIENTE DE GENERAR
  // ===================================================

  /**
   * Clientes actuales que todavía NO poseen
   * factura para zona + periodo.
   */
  clientesProyectados: number;

  /**
   * Precio mensual ACTUAL de los clientes
   * pendientes de generación.
   */
  montoProyectado: number;
}

export interface FacturacionReporteZonas {
  facturacion: FacturacionReporteZonaFacturacionRow[];

  recaudacion: FacturacionReporteZonaRecaudacionRow[];

  proyeccion: FacturacionReporteZonaProyeccionRow[];
}
