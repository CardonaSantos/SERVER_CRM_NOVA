import {
  ClienteFacturable,
  PlanPrimeraFactura,
} from '../read-models/cliente-facturable.read-model';

export const CLIENTE_FACTURABLE_QUERY = Symbol('CLIENTE_FACTURABLE_QUERY');

export interface ClienteFacturableQueryPort {
  findById(clienteId: number): Promise<ClienteFacturable | null>;

  /** `null` si la zona o el plan no existen. */
  findPlanPrimeraFactura(
    zonaId: number,
    servicioInternetId: number,
  ): Promise<PlanPrimeraFactura | null>;
}
