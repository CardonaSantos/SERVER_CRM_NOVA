import { RangoFechas } from '../policies/calendario.policy';
import { DatosResumen } from '../read-models/resumen.read-model';

export const RESUMEN_QUERY = Symbol('RESUMEN_QUERY');

export interface ResumenQueryPort {
  /**
   * Clientes vigentes hoy (la cobranza, sin desinstalados) y la facturación
   * del mes del rango (sin facturas anuladas): emitidas, facturado y pendiente
   * por el `periodo` de la factura; pagadas y cobrado por la fecha de pago.
   */
  findDatos(rango: RangoFechas): Promise<DatosResumen>;
}
