import type { FacturacionReporteMetodoPago } from '../../enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import type { FacturacionReporteOrigenPago } from '../../enums/facturacion-report/facturacion-reporte-origen-pago.enum';

export interface PagoReporteRow {
  // =====================================================
  // IDENTIDAD
  // =====================================================

  pagoId: number;

  facturaInternetId: number;

  /**
   * FacturaInternet.periodo al que pertenece
   * la factura pagada.
   *
   * Ejemplo:
   * 202608
   */
  facturaPeriodo: string;

  // =====================================================
  // CLIENTE
  // =====================================================

  clienteId: number;

  clienteNombre: string;

  // =====================================================
  // PAGO
  // =====================================================

  montoPagado: number;

  metodoPago: FacturacionReporteMetodoPago;

  origen: FacturacionReporteOrigenPago;

  fechaPago: Date;

  // =====================================================
  // COBRADOR
  // =====================================================

  cobradorId: number | null;

  cobradorNombre: string | null;

  // =====================================================
  // ZONA DE LA FACTURA
  // =====================================================

  facturacionZonaId: number | null;

  facturacionZonaNombre: string | null;

  // =====================================================
  // RUTA
  // =====================================================

  /**
   * PagoFacturaInternet.facturaRutaId.
   */
  facturaRutaId: number | null;

  /**
   * Se deriva desde FacturaRuta.
   *
   * No utilizamos RutaTurno ni CobroRuta.
   */
  rutaId: number | null;

  rutaNombre: string | null;

  // =====================================================
  // COMPROBANTES
  // =====================================================

  numeroBoleta: string | null;

  codigoConfirmacion: string | null;

  // =====================================================
  // AUDITORÍA
  // =====================================================

  creadoEn: Date;
}
