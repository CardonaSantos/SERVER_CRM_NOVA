export interface FacturacionReporteTopPagador {
  clienteId: number;

  cliente: string;

  pagosRegistrados: number;

  facturasConPago: number;

  totalPagado: number;
}

export interface FacturacionReporteTopDeudor {
  clienteId: number;

  cliente: string;

  facturasPendientes: number;

  fechaPagoEsperadaMasAntigua: Date | null;

  diasMoraMaximos: number | null;

  totalPendiente: number;
}

export interface FacturacionReporteProyeccionPeriodo {
  periodo: string;

  etiqueta: string;

  clientesProyectados: number;

  montoProyectado: number;
}

export interface FacturacionReporteDashboard {
  // =====================================================
  // FACTURACIÓN DEL RANGO
  // =====================================================

  facturacion: {
    facturasEmitidas: number;

    facturasAnuladas: number;

    totalFacturado: number;

    montoCubiertoActual: number;

    saldoPendienteActual: number;

    porcentajeCubiertoActual: number;

    facturasConSaldoPendiente: number;

    facturasVencidasConSaldo: number;
  };

  // =====================================================
  // COBROS REGISTRADOS EN EL RANGO
  // =====================================================

  cobros: {
    pagosRegistrados: number;

    clientesQuePagaron: number;

    totalRecaudado: number;

    pagoPromedio: number;
  };

  // =====================================================
  // CARTERA ACTUAL
  // =====================================================

  cartera: {
    cuentasPorCobrar: number;

    clientesConDeuda: number;

    facturasPendientes: number;

    saldoVencido: number;

    saldoPorVencer: number;

    saldoSinFechaVencimiento: number;
  };

  // =====================================================
  // PROYECCIÓN
  // =====================================================

  proyeccionMensual: FacturacionReporteProyeccionPeriodo[];

  // =====================================================
  // RANKINGS
  // =====================================================

  topPagadores: FacturacionReporteTopPagador[];

  topDeudores: FacturacionReporteTopDeudor[];
}
