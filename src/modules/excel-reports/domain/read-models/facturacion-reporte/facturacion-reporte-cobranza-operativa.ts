import type { FacturacionReporteMetodoPago } from '../../enums/facturacion-report/facturacion-reporte-metodo-pago.enum';

import type { FacturacionReporteOrigenPago } from '../../enums/facturacion-report/facturacion-reporte-origen-pago.enum';

// COBRADORES

export interface FacturacionReporteCobradorRow {
  cobradorId: number | null;

  cobrador: string;

  pagosRegistrados: number;

  clientesCobrados: number;

  facturasConPago: number;

  totalRecaudado: number;

  pagoPromedio: number;

  porcentajeRecaudacion: number;
}

// RUTAS

export interface FacturacionReporteRutaRow {
  rutaId: number;

  ruta: string;

  pagosRegistrados: number;

  clientesCobrados: number;

  facturasConPago: number;

  totalRecaudado: number;

  pagoPromedio: number;

  /**
   * Participación respecto del dinero
   * vinculado a alguna ruta.
   *
   * No respecto del total general, porque existen
   * pagos de oficina, transferencia, etc.
   */
  porcentajeRecaudacionRutas: number;
}

// MÉTODOS

export interface FacturacionReporteMetodoPagoRow {
  metodoPago: FacturacionReporteMetodoPago;

  pagosRegistrados: number;

  clientesQuePagaron: number;

  totalRecaudado: number;

  porcentajeRecaudacion: number;
}

// ORÍGENES

export interface FacturacionReporteOrigenPagoRow {
  origen: FacturacionReporteOrigenPago;

  pagosRegistrados: number;

  clientesQuePagaron: number;

  totalRecaudado: number;

  porcentajeRecaudacion: number;
}

// CONTROL

export interface FacturacionReporteCobranzaControl {
  /**
   * Puede ser válido para pagos automáticos,
   * transferencias, etc.
   *
   * Sólo informa que no existe cobrador registrado.
   */
  pagosSinCobradorRegistrado: number;

  montoSinCobradorRegistrado: number;

  /**
   * Cobros cuyo origen dice RUTA pero no poseen
   * vínculo PagoFacturaInternet -> FacturaRuta.
   */
  pagosOrigenRutaSinRutaVinculada: number;

  montoOrigenRutaSinRutaVinculada: number;
}

// CONTENEDOR

export interface FacturacionReporteCobranzaOperativa {
  cobradores: FacturacionReporteCobradorRow[];

  rutas: FacturacionReporteRutaRow[];

  metodosPago: FacturacionReporteMetodoPagoRow[];

  origenesPago: FacturacionReporteOrigenPagoRow[];

  control: FacturacionReporteCobranzaControl;
}
