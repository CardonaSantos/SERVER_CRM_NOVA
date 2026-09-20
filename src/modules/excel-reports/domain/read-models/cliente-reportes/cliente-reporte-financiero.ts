import { EstadoCliente, EstadoCobranzaCliente } from '@prisma/client';

/**
 * Distribución financiera de la cartera
 * actualmente facturable por plan.
 *
 * Los montos se calculan usando
 * ServicioInternet.precio real.
 */
export interface ClienteReporteFinancieroPlan {
  servicioInternetId: number;

  plan: string;

  precio: number;

  /**
   * Clientes actualmente facturables:
   *
   * - ACTIVO
   * - no eliminado
   * - no desinstalado
   * - con servicio
   */
  clientesFacturables: number;

  /**
   * clientesFacturables * precio
   */
  potencialMensual: number;

  /**
   * Participación del plan dentro del
   * potencial mensual total.
   *
   * Ejemplo:
   * 52.35 significa 52.35%.
   */
  porcentajePotencial: number;
}

/**
 * Cliente con saldo actualmente pendiente.
 *
 * No se infiere deuda desde estadoCliente
 * ni desde estadoCobranza.
 *
 * Los montos proceden de las facturas.
 */
export interface ClienteReporteFinancieroDeudor {
  clienteId: number;

  cliente: string;

  estadoCliente: EstadoCliente;

  estadoCobranza: EstadoCobranzaCliente;

  servicioInternetId: number | null;

  plan: string | null;

  /**
   * Saldo pendiente correspondiente a
   * facturas del mes evaluado.
   */
  pendienteMesActual: number;

  /**
   * Saldo pendiente de facturas anteriores
   * al mes evaluado.
   */
  deudaAnterior: number;

  /**
   * pendienteMesActual + deudaAnterior
   */
  totalPendiente: number;

  /**
   * Cantidad de FacturaInternet no anuladas
   * que actualmente aportan saldo pendiente
   * al total del cliente.
   */
  facturasPendientes: number;
}

/**
 * Resumen monetario del reporte de clientes.
 *
 * IMPORTANTE:
 *
 * Este modelo separa explícitamente:
 *
 * - potencial de cartera;
 * - facturación real emitida;
 * - facturación proyectada aún no emitida;
 * - pagos reales registrados;
 * - saldos actualmente pendientes.
 *
 * No deben mezclarse porque representan
 * conceptos administrativos distintos.
 */
export interface ClienteReporteFinanciero {
  periodo: {
    /**
     * Ejemplo:
     * "Agosto 2026"
     */
    etiqueta: string;

    /**
     * Inicio calendario del mes
     * en Guatemala.
     */
    desde: Date;

    /**
     * Primer instante del siguiente mes.
     */
    hastaExclusivo: Date;
  };

  // =====================================================
  // CARTERA ACTUAL
  // =====================================================

  /**
   * Cantidad de clientes actualmente
   * facturables.
   */
  clientesFacturablesActuales: number;

  /**
   * SUM(precio actual del plan)
   * de clientes actualmente facturables.
   *
   * Es una fotografía de la capacidad
   * mensual actual de la cartera.
   *
   * NO significa que ya haya sido facturado.
   */
  potencialMensualActual: number;

  /**
   * potencialMensualActual /
   * clientesFacturablesActuales
   */
  ingresoPotencialPromedioCliente: number;

  /**
   * Valor de los planes actualmente
   * asociados a clientes SUSPENDIDO.
   *
   * Es potencial recuperable.
   * NO se presenta como pérdida.
   */
  potencialMensualSuspendido: number;

  // =====================================================
  // FACTURACIÓN DEL MES
  // =====================================================

  // =====================================================
  // FACTURACIÓN DEL MES
  // =====================================================

  /**
   * Facturación estimada con sustento suficiente
   * para el ciclo mensual al momento del reporte.
   *
   * =
   * facturacionEmitidaMes
   * +
   * facturacionPendienteGenerarProgramadaMes
   *
   * IMPORTANTE:
   *
   * NO incluye los casos cuya fecha de generación
   * ya pasó pero no poseen factura, porque el estado
   * actual del cliente no demuestra que fuera
   * facturable el día histórico de generación.
   */
  facturacionEsperadaMes: number;

  /**
   * SUM(FacturaInternet.montoPago)
   * de facturas reales correspondientes al
   * período evaluado y no anuladas.
   *
   * Es dato real, no proyectado.
   */
  facturacionEmitidaMes: number;

  /**
   * Cantidad de facturas reales encontradas
   * para el período.
   */
  facturasEmitidasMes: number;

  /**
   * Importe todavía no facturado cuya fecha
   * programada de generación NO ha ocurrido
   * al momento del corte.
   *
   * Se obtiene de clientes actualmente facturables
   * y ServicioInternet.precio.
   *
   * Es una PROYECCIÓN.
   */
  facturacionPendienteGenerarProgramadaMes: number;

  /**
   * Clientes actualmente facturables cuya
   * generación correspondiente al período
   * todavía está programada para una fecha futura.
   */
  clientesPendientesGenerarProgramadaMes: number;

  /**
   * Importe potencial de clientes actualmente
   * facturables que:
   *
   * - deberían asociarse a este período según
   *   la configuración de su zona;
   * - ya tienen la fecha programada de generación
   *   en el pasado;
   * - pero no poseen FacturaInternet del período.
   *
   * IMPORTANTE:
   *
   * NO se considera automáticamente deuda.
   * NO se suma a facturacionEsperadaMes.
   *
   * Es un monto de CONTROL / REVISIÓN porque
   * no podemos asegurar solamente desde el
   * snapshot actual que el cliente ya fuera
   * facturable el día histórico de generación.
   */
  facturacionSinFacturaRevisarMes: number;

  /**
   * Cantidad de clientes correspondientes
   * al caso anterior.
   */
  clientesSinFacturaRevisarMes: number;

  // =====================================================
  // COBRANZA DE FACTURAS DEL MES
  // =====================================================

  /**
   * Valor ya aplicado/cubierto sobre las
   * facturas correspondientes al mes.
   *
   * Se calculará sobre facturas existentes.
   *
   * montoPago - saldoPendiente
   */
  aplicadoFacturasMes: number;

  /**
   * SUM(saldoPendiente) de facturas reales
   * correspondientes al mes.
   */
  saldoPendienteFacturasMes: number;

  /**
   * aplicadoFacturasMes /
   * facturacionEmitidaMes * 100
   *
   * IMPORTANTE:
   * este porcentaje sólo mide FACTURAS EMITIDAS.
   *
   * No vamos a simular cobranza sobre facturas
   * que todavía no existen.
   */
  porcentajeCobranzaFacturasMes: number;

  // =====================================================
  // RECAUDACIÓN REAL
  // =====================================================

  /**
   * SUM(PagoFacturaInternet.montoPagado)
   * cuya fechaPago ocurrió dentro del mes.
   *
   * Puede incluir pagos aplicados a facturas
   * de períodos anteriores.
   */
  recaudadoDuranteMes: number;

  // =====================================================
  // CUENTAS POR COBRAR
  // =====================================================

  /**
   * Saldos pendientes de facturas anteriores
   * al mes actual.
   *
   * No depende de que estadoFacturaInternet
   * haya sido correctamente cambiado a VENCIDA.
   */
  deudaAnterior: number;

  /**
   * deudaAnterior
   * +
   * saldoPendienteFacturasMes
   *
   * No incluye facturación futura todavía
   * no generada.
   */
  cuentasPorCobrarAlCorte: number;

  // =====================================================
  // DISTRIBUCIONES
  // =====================================================

  carteraPorPlan: ClienteReporteFinancieroPlan[];

  /**
   * Ordenado de mayor a menor
   * por totalPendiente.
   */
  topClientesSaldoPendiente: ClienteReporteFinancieroDeudor[];
}
