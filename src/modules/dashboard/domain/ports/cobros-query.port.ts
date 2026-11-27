import { CobrosDashboardReadModel } from '../read-models/cobros.read-model';

export const COBROS_QUERY = Symbol('COBROS_QUERY');

export interface CobrosQueryPort {
  /**
   * Rutas abiertas y los clientes vigentes (ni eliminados ni desinstalados)
   * con más facturas sin pagar.
   */
  findResumen(limite: number): Promise<CobrosDashboardReadModel>;
}
