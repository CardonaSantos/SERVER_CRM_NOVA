import {
  FacturaDelPeriodo,
  FacturaSinPagar,
  PagoRecibido,
} from '../read-models/finanzas.read-model';

export const FINANZAS_QUERY = Symbol('FINANZAS_QUERY');

export interface FinanzasQueryPort {
  /**
   * Facturas (sin anuladas) que corresponden a esos meses `YYYY-MM`. Es
   * historia: incluye las de clientes eliminados después.
   */
  findFacturasDeMeses(meses: string[]): Promise<FacturaDelPeriodo[]>;
  /** Pagos recibidos en esos meses. */
  findPagosDeMeses(meses: string[]): Promise<PagoRecibido[]>;
  /** Lo que hoy deben los clientes no eliminados. */
  findFacturasSinPagar(): Promise<FacturaSinPagar[]>;
}
