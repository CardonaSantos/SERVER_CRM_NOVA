import { Paginacion, ResultadoPaginado } from 'src/common/hexagonal/paginacion';

import { ClientePppoeCuentaDetalleReadModel } from '../read-models/cliente-pppoe-cuenta-detalle.read-model';
import {
  ClientePppoeCuentaFiltros,
  ClientePppoeCuentaListItem,
} from '../read-models/cliente-pppoe-cuenta-listado.read-model';

export const CLIENTE_PPPOE_CUENTA_QUERY = Symbol('CLIENTE_PPPOE_CUENTA_QUERY');

export interface ClientePppoeCuentaQueryPort {
  /** Más recientes primero; `total` cuadra con la página (misma transacción). */
  findMany(
    filtros: ClientePppoeCuentaFiltros,
    paginacion: Paginacion,
  ): Promise<ResultadoPaginado<ClientePppoeCuentaListItem>>;

  findDetailById(
    cuentaPppoeId: number,
  ): Promise<ClientePppoeCuentaDetalleReadModel | null>;
}
