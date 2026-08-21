import type { FacturacionReporteEstadoFactura } from '../../enums/facturacion-report/facturacion-reporte-estado-factura.enum';

export interface FacturaReporteRow {
  // =====================================================
  // IDENTIDAD
  // =====================================================

  facturaId: number;

  /**
   * Valor canónico almacenado en FacturaInternet.periodo.
   *
   * Ejemplos:
   * 202501
   * 202502
   * 202608
   */
  periodo: string;

  // =====================================================
  // CLIENTE
  // =====================================================

  clienteId: number;

  /**
   * Snapshot almacenado en la factura.
   */
  nombreClienteFactura: string | null;

  /**
   * Nombre actual del cliente.
   *
   * Se conserva separado para no sustituir
   * silenciosamente el snapshot histórico.
   */
  clienteNombreActual: string;

  // =====================================================
  // ZONA
  // =====================================================

  facturacionZonaId: number | null;

  facturacionZonaNombre: string | null;

  // =====================================================
  // CREADOR
  // =====================================================

  creadorId: number | null;

  creadorNombre: string | null;

  // =====================================================
  // FACTURACIÓN
  // =====================================================

  fechaPagoEsperada: Date | null;

  fechaPagada: Date | null;

  montoFactura: number;

  saldoPendiente: number;

  estado: FacturacionReporteEstadoFactura;

  detalleFactura: string | null;

  // =====================================================
  // AUDITORÍA
  // =====================================================

  creadoEn: Date;

  actualizadoEn: Date;
}
