import { RangoFechas } from '../policies/calendario.policy';
import { DatosResumen } from '../read-models/resumen.read-model';

export const RESUMEN_QUERY = Symbol('RESUMEN_QUERY');

export interface ResumenQueryPort {
  /**
   * Clientes vigentes hoy (la cobranza, sin desinstalados) y la facturación
   * del rango (sin facturas anuladas).
   */
  findDatos(rango: RangoFechas): Promise<DatosResumen>;
}
