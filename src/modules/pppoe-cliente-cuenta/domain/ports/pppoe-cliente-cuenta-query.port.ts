import {
  ClientePppoeCuentaFindManyFilters,
  ClientePppoeCuentaPaginatedResult,
} from '../read-models/cliente-pppoe-cuenta-listado.read-model';

import { ClientePppoeCuentaDetalleReadModel } from '../read-models/cliente-pppoe-cuenta-detalle.read-model';

export const CLIENTE_PPPOE_CUENTA_QUERY = Symbol('CLIENTE_PPPOE_CUENTA_QUERY');

export type BuscarDetalleCuentaPppoeParams = {
  empresaId: number;

  cuentaPppoeId: number;
};

export interface ClientePppoeCuentaQueryPort {
  findMany(
    filters: ClientePppoeCuentaFindManyFilters,
  ): Promise<ClientePppoeCuentaPaginatedResult>;

  findDetailById(
    params: BuscarDetalleCuentaPppoeParams,
  ): Promise<ClientePppoeCuentaDetalleReadModel | null>;
}
