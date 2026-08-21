export interface FacturacionReporteEvolucionFacturacionRow {
  periodo: string;

  etiqueta: string;

  facturasEmitidas: number;

  facturasAnuladas: number;

  facturado: number;

  cubiertoActual: number;

  saldoPendienteActual: number;

  porcentajeCubiertoActual: number;
}

export interface FacturacionReporteEvolucionRecaudacionRow {
  periodo: string;

  etiqueta: string;

  pagosRegistrados: number;

  clientesQuePagaron: number;

  recaudado: number;

  pagoPromedio: number;
}

export interface FacturacionReporteRecuperacionCohorteRow {
  periodo: string;

  etiqueta: string;

  facturas: number;

  montoFacturado: number;

  /**
   * Recuperación actual de la cohorte:
   *
   * montoFactura - saldoPendiente
   */
  cubiertoActual: number;

  saldoPendienteActual: number;

  porcentajeRecuperadoActual: number;

  // =====================================================
  // AL VENCIMIENTO
  // =====================================================

  facturasElegiblesAlVencimiento: number;

  montoElegibleAlVencimiento: number;

  recuperadoAlVencimiento: number;

  porcentajeRecuperadoAlVencimiento: number;

  // =====================================================
  // +30 DÍAS
  // =====================================================

  facturasElegibles30Dias: number;

  montoElegible30Dias: number;

  recuperado30Dias: number;

  porcentajeRecuperado30Dias: number;

  // =====================================================
  // +60 DÍAS
  // =====================================================

  facturasElegibles60Dias: number;

  montoElegible60Dias: number;

  recuperado60Dias: number;

  porcentajeRecuperado60Dias: number;
}

export interface FacturacionReporteEvolucion {
  facturacionMensual: FacturacionReporteEvolucionFacturacionRow[];

  recaudacionMensual: FacturacionReporteEvolucionRecaudacionRow[];

  recuperacionCohortes: FacturacionReporteRecuperacionCohorteRow[];
}
